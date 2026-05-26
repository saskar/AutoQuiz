import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: { quizId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId, published: true },
    include: { questions: { orderBy: { order: "asc" } } },
  })
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 })

  // Check closeAt
  if (quiz.closeAt && new Date() > quiz.closeAt) {
    return NextResponse.json({ error: "This quiz is no longer accepting submissions" }, { status: 403 })
  }

  const existing = await prisma.submission.findFirst({
    where: { quizId: params.quizId, studentId: session.user.id },
  })
  if (existing) {
    return NextResponse.json(
      { error: "Already submitted", submissionId: existing.id },
      { status: 400 }
    )
  }

  const body = await request.json()
  const { answers } = body as { answers: Record<string, string> }

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0)
  let earnedPoints = 0

  const answerRecords = quiz.questions.map((question) => {
    const studentAnswer = (answers[question.id] ?? "").trim()
    let isCorrect = false

    if (question.type === "SURVEY") {
      isCorrect = studentAnswer.length > 0
    } else if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
      isCorrect = studentAnswer === question.answer
    } else {
      // SHORT_ANSWER and FILL_BLANK: case-insensitive
      isCorrect = studentAnswer.toLowerCase() === question.answer.toLowerCase()
    }

    const pointsEarned = isCorrect ? question.points : 0
    earnedPoints += pointsEarned

    return { questionId: question.id, value: studentAnswer, isCorrect, pointsEarned }
  })

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

  // Compute pass/fail for EXAM mode
  const passed = quiz.mode === "EXAM"
    ? score >= (quiz.passingScore ?? 60)
    : null

  const submission = await prisma.submission.create({
    data: {
      quizId: params.quizId,
      studentId: session.user.id,
      score,
      earnedPoints,
      totalPoints,
      answers: { create: answerRecords },
    },
  })

  return NextResponse.json({ submissionId: submission.id, score, passed }, { status: 201 })
}
