import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const mine = searchParams.get("mine") === "true"
  const quizId = searchParams.get("quizId")

  if (mine) {
    const submissions = await prisma.submission.findMany({
      where: { studentId: session.user.id },
      include: { quiz: { select: { id: true, title: true } } },
      orderBy: { submittedAt: "desc" },
    })
    return NextResponse.json(submissions)
  }

  if (quizId) {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } })
    if (!quiz || quiz.instructorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const submissions = await prisma.submission.findMany({
      where: { quizId },
      include: { student: { select: { name: true, image: true, email: true } } },
      orderBy: { submittedAt: "desc" },
    })
    return NextResponse.json(submissions)
  }

  return NextResponse.json([])
}
