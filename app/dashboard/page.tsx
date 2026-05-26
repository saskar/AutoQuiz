"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface Quiz {
  id: string
  title: string
  description: string | null
  published: boolean
  mode: string
  createdAt: string
  _count: { questions: number; submissions: number }
}

interface Submission {
  id: string
  score: number
  submittedAt: string
  quiz: { id: string; title: string; mode?: string }
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-green-600 bg-green-50" :
    score >= 50 ? "text-yellow-600 bg-yellow-50" :
    "text-red-600 bg-red-50"
  return (
    <span className={`inline-flex items-baseline gap-0.5 font-bold text-lg px-2 py-0.5 rounded-lg ${color}`}>
      {Math.round(score)}<span className="text-xs font-normal opacity-70">%</span>
    </span>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([])
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  useEffect(() => {
    if (!session) return
    Promise.all([
      fetch("/api/quizzes?mine=true").then((r) => r.json()),
      fetch("/api/submissions?mine=true").then((r) => r.json()),
    ]).then(([quizzes, subs]) => {
      setMyQuizzes(Array.isArray(quizzes) ? quizzes : [])
      setMySubmissions(Array.isArray(subs) ? subs : [])
      setLoading(false)
    })
  }, [session])

  const handleDelete = async (quizId: string) => {
    if (!confirm("Delete this quiz and all its submissions?")) return
    await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" })
    setMyQuizzes((qs) => qs.filter((q) => q.id !== quizId))
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const firstName = session?.user.name?.split(" ")[0] ?? "there"
  const avgScore = mySubmissions.length > 0
    ? Math.round(mySubmissions.reduce((s, sub) => s + sub.score, 0) / mySubmissions.length)
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero gradient card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white px-8 py-10 mb-8 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <svg className="w-8 h-8 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H13L13 2z" />
          </svg>
          <span className="text-2xl font-extrabold tracking-tight">AutoQuiz</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}!</h1>
        <p className="text-indigo-200 mb-6 text-sm max-w-md">
          Create, manage and assign quizzes or take them as a student. Powered by AI.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/quiz/create"
            className="bg-white text-indigo-700 font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-indigo-50 transition-colors shadow"
          >
            Create Quiz
          </Link>
          <Link
            href="/browse"
            className="text-white text-sm font-medium hover:text-indigo-200 transition-colors"
          >
            Browse Quizzes &rarr;
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard
          label="Quizzes Created"
          value={myQuizzes.length}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Quizzes Taken"
          value={mySubmissions.length}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8M12 17v4M5 3H3a2 2 0 00-2 2v4c0 3.314 2.686 6 6 6m0 0h8m-8 0a6 6 0 006 0m-6 0V3m6 0h2a2 2 0 012 2v4c0 3.314-2.686 6-6 6M5 3h14" />
            </svg>
          }
        />
        <StatCard
          label="Avg Score %"
          value={mySubmissions.length > 0 ? `${avgScore}%` : "–"}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* My Quizzes */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Your Quizzes</h2>
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            View all &rarr;
          </Link>
        </div>

        {myQuizzes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-400 text-sm mb-3">No quizzes yet.</p>
            <Link href="/quiz/create" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              Create your first quiz &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myQuizzes.slice(0, 6).map((quiz) => (
              <div key={quiz.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate flex-1 pr-2">{quiz.title}</h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {quiz.mode === "EXAM" && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">Exam</span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                        quiz.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {quiz.published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
                {quiz.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{quiz.description}</p>
                )}
                <div className="flex gap-4 text-xs text-gray-400 mb-4 mt-auto">
                  <span>{quiz._count.questions} questions</span>
                  <span>{quiz._count.submissions} submissions</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/quiz/${quiz.id}/edit`}
                    className="flex-1 text-center text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/quiz/${quiz.id}/results`}
                    className="flex-1 text-center text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1.5 rounded-lg transition-colors"
                  >
                    Results
                  </Link>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="px-3 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Attempts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Attempts</h2>
          <Link href="/my-results" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View all &rarr;
          </Link>
        </div>

        {mySubmissions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-400 text-sm mb-3">You haven&apos;t taken any quizzes yet.</p>
            <Link href="/browse" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              Browse available quizzes &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mySubmissions.slice(0, 6).map((sub) => (
              <Link
                key={sub.id}
                href={`/quiz/${sub.quiz.id}/result?submissionId=${sub.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex items-start justify-between"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{sub.quiz.title}</h3>
                  <p className="text-xs text-gray-400">
                    {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <ScoreBadge score={sub.score} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
