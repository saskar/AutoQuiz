import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { quizId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      questions: { orderBy: { order: "asc" } },
      instructor: { select: { id: true, name: true, image: true } },
    },
  })

  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!quiz.published && quiz.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Strip correct answers for non-instructors
  if (quiz.instructorId !== session.user.id) {
    return NextResponse.json({
      ...quiz,
      questions: quiz.questions.map((q) => ({ ...q, answer: "" })),
    })
  }

  return NextResponse.json(quiz)
}

export async function PUT(request: Request, { params }: { params: { quizId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const quiz = await prisma.quiz.findUnique({ where: { id: params.quizId } })
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (quiz.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, examType, mode, passingScore, closeAt, timeLimit, passage, collectName, namePrompt, questions, published } = body

  try {
    await prisma.question.deleteMany({ where: { quizId: params.quizId } })

    const updated = await prisma.quiz.update({
      where: { id: params.quizId },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        examType: examType ?? quiz.examType,
        mode: mode ?? quiz.mode,
        passingScore: passingScore != null ? Number(passingScore) : null,
        closeAt: closeAt ? new Date(closeAt) : null,
        timeLimit: timeLimit ? Number(timeLimit) : null,
        passage: passage?.trim() || null,
        collectName: collectName ?? quiz.collectName,
        namePrompt: namePrompt?.trim() || null,
        published: published ?? quiz.published,
        questions: {
          create: questions.map((q: any, index: number) => ({
            text: q.text,
            type: q.type,
            options: q.options?.length ? JSON.stringify(q.options) : null,
            answer: q.answer,
            points: Number(q.points) || 1,
            order: index,
          })),
        },
      },
      include: { questions: true },
    })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error("Quiz update error:", err)
    const msg = err?.message ?? "Failed to save quiz"
    if (msg.includes("passage") || msg.includes("collectName") || msg.includes("namePrompt")) {
      return NextResponse.json(
        { error: "Database schema is out of date. Run: npx prisma db push" },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { quizId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const quiz = await prisma.quiz.findUnique({ where: { id: params.quizId } })
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (quiz.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.quiz.delete({ where: { id: params.quizId } })
  return NextResponse.json({ success: true })
}
