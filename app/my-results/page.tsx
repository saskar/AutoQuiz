"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Submission {
  id: string
  score: number
  earnedPoints: number
  totalPoints: number
  submittedAt: string
  quiz: {
    id: string
    title: string
    mode: string
    passingScore: number | null
    examType: string
  }
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-green-600 bg-green-50 border-green-200" :
    score >= 50 ? "text-yellow-600 bg-yellow-50 border-yellow-200" :
    "text-red-600 bg-red-50 border-red-200"
  return (
    <span className={`inline-flex items-baseline gap-0.5 font-bold text-base px-2.5 py-1 rounded-lg border ${color}`}>
      {Math.round(score)}<span className="text-xs font-normal opacity-70">%</span>
    </span>
  )
}

export default function MyResultsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  useEffect(() => {
    if (!session) return
    fetch("/api/submissions?mine=true")
      .then((r) => r.json())
      .then((data) => {
        setSubmissions(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [session])

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
          <p className="text-sm text-gray-500">All your quiz and exam submissions</p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-gray-500 mb-3">You haven&apos;t taken any quizzes yet.</p>
          <Link href="/browse" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Browse available quizzes →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Quiz / Exam</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Result</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((sub) => {
                  const isExam = sub.quiz.mode === "EXAM"
                  const passing = sub.quiz.passingScore ?? 60
                  const passed = isExam ? sub.score >= passing : null

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{sub.quiz.title}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isExam ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {isExam ? "Exam" : "Quiz"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <ScoreBadge score={sub.score} />
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        {passed !== null ? (
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {passed ? "PASSED" : "FAILED"}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 hidden md:table-cell">
                        {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/quiz/${sub.quiz.id}/result?submissionId=${sub.id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
