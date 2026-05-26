"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Submission {
  id: string
  score: number
  submittedAt: string
  quiz: {
    id: string
    title: string
    mode: string
    passingScore: number | null
    examType: string
  }
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color ?? "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function ReportCardPage() {
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

  const total = submissions.length
  const avgScore = total > 0 ? Math.round(submissions.reduce((s, sub) => s + sub.score, 0) / total) : 0
  const bestScore = total > 0 ? Math.round(Math.max(...submissions.map((s) => s.score))) : 0

  const examSubs = submissions.filter((s) => s.quiz.mode === "EXAM")
  const passedExams = examSubs.filter((s) => s.score >= (s.quiz.passingScore ?? 60))
  const passRate = examSubs.length > 0 ? Math.round((passedExams.length / examSubs.length) * 100) : null

  // Group by subject (examType)
  const byType: Record<string, { count: number; total: number }> = {}
  submissions.forEach((s) => {
    const key = s.quiz.examType || "QUIZ"
    if (!byType[key]) byType[key] = { count: 0, total: 0 }
    byType[key].count++
    byType[key].total += s.score
  })

  const recent = submissions.slice(0, 10)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Card</h1>
          <p className="text-sm text-gray-500">Your overall performance summary</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-4xl mb-4">🎓</div>
          <p className="text-gray-500 mb-3">No data yet. Take some quizzes to see your report card.</p>
          <Link href="/browse" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Browse available quizzes →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Taken" value={total} />
            <StatCard
              label="Average Score"
              value={`${avgScore}%`}
              color={avgScore >= 70 ? "text-green-600" : avgScore >= 50 ? "text-yellow-600" : "text-red-600"}
            />
            <StatCard
              label="Best Score"
              value={`${bestScore}%`}
              color="text-indigo-600"
            />
            <StatCard
              label="Exam Pass Rate"
              value={passRate !== null ? `${passRate}%` : "—"}
              sub={passRate !== null ? `${passedExams.length}/${examSubs.length} exams` : "No exams taken"}
              color={passRate !== null ? (passRate >= 70 ? "text-green-600" : "text-red-600") : "text-gray-400"}
            />
          </div>

          {/* Recent scores */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Scores</h2>
            <div className="space-y-3">
              {recent.map((sub) => {
                const isExam = sub.quiz.mode === "EXAM"
                const passing = sub.quiz.passingScore ?? 60
                const passed = isExam ? sub.score >= passing : null
                const barColor = sub.score >= 70 ? "bg-green-500" : sub.score >= 50 ? "bg-yellow-500" : "bg-red-500"

                return (
                  <div key={sub.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-700 truncate pr-2">{sub.quiz.title}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {passed !== null && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${passed ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}`}>
                              {passed ? "P" : "F"}
                            </span>
                          )}
                          <span className="text-xs font-bold text-gray-700">{Math.round(sub.score)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${sub.score}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* By type breakdown */}
          {Object.keys(byType).length > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">By Exam Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(byType).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 capitalize">{type.toLowerCase().replace("_", " ")}</p>
                      <p className="text-xs text-gray-400">{data.count} attempt{data.count !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-lg font-bold text-indigo-600">
                      {Math.round(data.total / data.count)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
