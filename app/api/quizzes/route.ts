import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const mine = searchParams.get("mine") === "true"

  if (mine) {
    const quizzes = await prisma.quiz.findMany({
      where: { instructorId: session.user.id },
      include: {
        _count: { select: { questions: true, submissions: true } },
        instructor: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(quizzes)
  }

  const quizzes = await prisma.quiz.findMany({
    where: { published: true },
    include: {
      _count: { select: { questions: true } },
      instructor: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(quizzes)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { title, description, examType, mode, passingScore, closeAt, timeLimit, passage, collectName, namePrompt, questions, published } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  try {
    const quiz = await prisma.quiz.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        examType: examType ?? "QUIZ",
        mode: mode ?? "QUIZ",
        passingScore: passingScore ? Number(passingScore) : null,
        closeAt: closeAt ? new Date(closeAt) : null,
        timeLimit: timeLimit ? Number(timeLimit) : null,
        passage: passage?.trim() || null,
        collectName: collectName ?? false,
        namePrompt: namePrompt?.trim() || null,
        published: published ?? false,
        instructorId: session.user.id,
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
    return NextResponse.json(quiz, { status: 201 })
  } catch (err: any) {
    console.error("Quiz create error:", err)
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
