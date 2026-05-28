"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface Answer {
  id: string
  value: string
  isCorrect: boolean
  pointsEarned: number
  question: {
    id: string
    text: string
    type: string
    answer: string
    options: string | null
    points: number
    order: number
  }
}

interface Submission {
  id: string
  score: number
  earnedPoints: number
  totalPoints: number
  submittedAt: string
  quiz: { id: string; title: string; mode: string; passingScore: number | null }
  student: { name: string | null; image: string | null }
  answers: Answer[]
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626"
  const grade =
    score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F"
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-32 h-32 rounded-full flex flex-col items-center justify-center border-8"
        style={{ borderColor: color }}
      >
        <span className="text-4xl font-bold" style={{ color }}>
          {Math.round(score)}
        </span>
        <span className="text-xs text-gray-400 -mt-1">/ 100</span>
      </div>
      <span className="mt-2 text-lg font-bold" style={{ color }}>
        Grade: {grade}
      </span>
    </div>
  )
}

export default function ResultPage({ params }: { params: { quizId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const submissionId = searchParams.get("submissionId")
  const studentName = searchParams.get("name") ?? ""

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  useEffect(() => {
    if (!session || !submissionId) return
    fetch(`/api/submissions/${submissionId}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data) => {
        setSubmission(data)
        setLoading(false)
      })
      .catch(() => router.push("/dashboard"))
  }, [session, submissionId, router])

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!submission) return null

  const sorted = [...submission.answers].sort((a, b) => a.question.order - b.question.order)
  const correct = sorted.filter((a) => a.isCorrect).length

  const isExam = submission.quiz.mode === "EXAM"
  const passingScore = submission.quiz.passingScore ?? 60
  const passed = isExam ? submission.score >= passingScore : null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block">
        ← Dashboard
      </Link>

      {studentName && (
        <div className="mb-4 bg-violet-50 border border-violet-200 rounded-xl px-5 py-3 text-sm text-violet-800 font-medium">
          {submission.score >= 70
            ? `Great work, ${studentName}! 🎉`
            : submission.score >= 50
            ? `Good effort, ${studentName}! Keep practising.`
            : `Keep going, ${studentName}! You'll get there.`}
        </div>
      )}

      {/* Pass/Fail banner for EXAM mode */}
      {isExam && passed !== null && (
        <div
          className={`mb-4 rounded-xl px-5 py-4 flex items-center gap-3 ${
            passed
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <span className="text-2xl">{passed ? "✓" : "✗"}</span>
          <div>
            <p className={`font-bold text-lg ${passed ? "text-green-700" : "text-red-700"}`}>
              {passed ? "PASSED" : "FAILED"}
            </p>
            <p className={`text-sm ${passed ? "text-green-600" : "text-red-600"}`}>
              {passed
                ? `You scored ${Math.round(submission.score)}% — above the ${passingScore}% passing threshold.`
                : `You scored ${Math.round(submission.score)}% — below the ${passingScore}% passing threshold.`}
            </p>
          </div>
        </div>
      )}

      {/* Score summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{submission.quiz.title}</h1>
        <p className="text-sm text-gray-500 mb-6">
          Submitted {new Date(submission.submittedAt).toLocaleString()}
        </p>
        <ScoreCircle score={submission.score} />
        <div className="mt-5 flex justify-center gap-8 text-sm text-gray-600">
          <div className="text-center">
            <div className="font-bold text-gray-900 text-lg">{submission.earnedPoints}</div>
            <div className="text-xs text-gray-400">points earned</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900 text-lg">{submission.totalPoints}</div>
            <div className="text-xs text-gray-400">total points</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900 text-lg">{correct}/{sorted.length}</div>
            <div className="text-xs text-gray-400">correct</div>
          </div>
        </div>
      </div>

      {/* Per-question feedback — hide for EXAM mode */}
      {!isExam && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Question Breakdown</h2>
          {sorted.map((answer, index) => {
            const options: string[] = answer.question.options
              ? JSON.parse(answer.question.options)
              : []

            const isSurvey = answer.question.type === "SURVEY"
            return (
              <div
                key={answer.id}
                className={`bg-white rounded-xl border p-5 shadow-sm ${
                  isSurvey
                    ? "border-teal-200"
                    : answer.isCorrect
                    ? "border-green-200"
                    : "border-red-200"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                        isSurvey
                          ? "bg-teal-100 text-teal-700"
                          : answer.isCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isSurvey ? "•" : answer.isCorrect ? "✓" : "✗"}
                    </span>
                    <div>
                      {isSurvey && (
                        <span className="text-xs text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded font-medium mr-2">Opinion</span>
                      )}
                      <span className="text-sm font-medium text-gray-800">{answer.question.text}</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium flex-shrink-0 ml-3">
                    {isSurvey ? "Recorded" : `${answer.pointsEarned}/${answer.question.points}pt${answer.question.points !== 1 ? "s" : ""}`}
                  </span>
                </div>

                <div className="ml-7 space-y-1 text-sm">
                  <div className="flex gap-2">
                    <span className="text-gray-400 text-xs w-20 flex-shrink-0 pt-0.5">
                      {isSurvey ? "Response" : "Your answer"}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        isSurvey
                          ? "text-teal-700 bg-teal-50"
                          : answer.isCorrect
                          ? "text-green-700 bg-green-50"
                          : "text-red-700 bg-red-50 line-through"
                      }`}
                    >
                      {answer.value || "(no answer)"}
                    </span>
                  </div>
                  {!isSurvey && !answer.isCorrect && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 text-xs w-20 flex-shrink-0 pt-0.5">Correct</span>
                      <span className="text-xs px-2 py-0.5 rounded font-medium text-green-700 bg-green-50">
                        {answer.question.answer}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isExam && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-center text-sm text-gray-500">
          Detailed answers are not shown for exam mode.
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link
          href="/browse"
          className="flex-1 text-center border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50"
        >
          Take another quiz
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 text-center bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700"
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
