import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { submissionId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const submission = await prisma.submission.findUnique({
    where: { id: params.submissionId },
    include: {
      answers: {
        include: { question: true },
        orderBy: { question: { order: "asc" } },
      },
      quiz: { select: { id: true, title: true, instructorId: true, mode: true, passingScore: true } },
      student: { select: { name: true, image: true } },
    },
  })

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (
    submission.studentId !== session.user.id &&
    submission.quiz.instructorId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(submission)
}
