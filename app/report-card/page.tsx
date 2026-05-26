"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

function letterGrade(score: number) {
  if (score >= 90) return { grade: "A+", color: "text-green-600" }
  if (score >= 85) return { grade: "A", color: "text-green-600" }
  if (score >= 80) return { grade: "B+", color: "text-blue-600" }
  if (score >= 75) return { grade: "B", color: "text-blue-600" }
  if (score >= 70) return { grade: "C+", color: "text-yellow-600" }
  if (score >= 65) return { grade: "C", color: "text-yellow-600" }
  if (score >= 60) return { grade: "D", color: "text-orange-600" }
  return { grade: "F", color: "text-red-600" }
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="truncate max-w-[70%]">{label}</span>
        <span className="font-semibold">{Math.round(score)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
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

  if (submissions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🎓</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Card</h1>
        <p className="text-gray-500 text-sm mb-6">Take some quizzes to see your report card here.</p>
        <Link href="/browse" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700">
          Browse Quizzes
        </Link>
      </div>
    )
  }

  const avgScore = Math.round(submissions.reduce((a, s) => a + s.score, 0) / submissions.length)
  const best = Math.round(Math.max(...submissions.map((s) => s.score)))
  const worst = Math.round(Math.min(...submissions.map((s) => s.score)))
  const examSubs = submissions.filter((s) => s.quiz.mode === "EXAM")
  const passedExams = examSubs.filter((s) => s.score >= (s.quiz.passingScore ?? 60)).length
  const passRate = examSubs.length > 0 ? Math.round((passedExams / examSubs.length) * 100) : null
  const { grade, color } = letterGrade(avgScore)

  // Recent 10 scores for trend
  const recent = [...submissions]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 10)
    .reverse()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Report Card</h1>
      </div>

      {/* Grade summary card */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white rounded-2xl p-8 mb-6 shadow-lg flex items-center justify-between">
        <div>
          <p className="text-indigo-200 text-sm mb-1">Overall Average</p>
          <div className="text-6xl font-extrabold mb-1">{avgScore}%</div>
          <p className="text-indigo-200 text-sm">{submissions.length} quiz attempt{submissions.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="text-right">
          <div className={`text-7xl font-extrabold ${avgScore >= 70 ? "text-yellow-300" : avgScore >= 50 ? "text-orange-300" : "text-red-300"}`}>
            {grade}
          </div>
          <p className="text-indigo-200 text-xs mt-1">Letter grade</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Best Score", value: `${best}%`, emoji: "🏆" },
          { label: "Lowest Score", value: `${worst}%`, emoji: "📉" },
          { label: "Exams Taken", value: examSubs.length, emoji: "📋" },
          { label: "Exam Pass Rate", value: passRate !== null ? `${passRate}%` : "—", emoji: "✅" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
            <div className="text-2xl mb-1">{s.emoji}</div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Scores</h2>
          <div className="space-y-3">
            {recent.map((sub) => (
              <ScoreBar key={sub.id} score={sub.score} label={sub.quiz.title} />
            ))}
          </div>
        </div>

        {/* Score distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Score Distribution</h2>
          <div className="space-y-3">
            {[
              { label: "90–100% (A)", min: 90, color: "bg-green-500" },
              { label: "70–89% (B–C)", min: 70, max: 90, color: "bg-blue-500" },
              { label: "50–69% (D)", min: 50, max: 70, color: "bg-amber-500" },
              { label: "0–49% (F)", max: 50, color: "bg-red-500" },
            ].map((band) => {
              const count = submissions.filter((s) =>
                s.score >= (band.min ?? 0) && s.score < (band.max ?? 101)
              ).length
              const pct = submissions.length > 0 ? (count / submissions.length) * 100 : 0
              return (
                <div key={band.label}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{band.label}</span>
                    <span className="font-semibold">{count} attempt{count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${band.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <Link
              href="/my-results"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all attempts →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
