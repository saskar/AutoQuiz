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
  createdAt: string
  _count: { questions: number; submissions: number }
}

interface Submission {
  id: string
  score: number
  submittedAt: string
  quiz: { id: string; title: string }
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-green-600 bg-green-50" :
    score >= 50 ? "text-yellow-600 bg-yellow-50" :
    "text-red-600 bg-red-50"
  return (
    <span className={`inline-flex items-baseline gap-0.5 font-bold text-lg px-2 py-0.5 rounded-lg ${color}`}>
      {Math.round(score)}<span className="text-xs font-normal opacity-70">/100</span>
    </span>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        {session?.user.image && (
          <Image src={session.user.image} alt="" width={40} height={40} className="rounded-full" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session?.user.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500">Manage your quizzes or review your attempts below.</p>
        </div>
      </div>

      {/* My Quizzes */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">My Quizzes</h2>
          <Link
            href="/quiz/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Create Quiz
          </Link>
        </div>

        {myQuizzes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-400 text-sm mb-3">No quizzes yet.</p>
            <Link href="/quiz/create" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              Create your first quiz →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myQuizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate flex-1 pr-2">{quiz.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                      quiz.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {quiz.published ? "Published" : "Draft"}
                  </span>
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
          <h2 className="text-lg font-semibold text-gray-800">My Quiz Attempts</h2>
          <Link href="/browse" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Browse quizzes →
          </Link>
        </div>

        {mySubmissions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-400 text-sm mb-3">You haven&apos;t taken any quizzes yet.</p>
            <Link href="/browse" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              Browse available quizzes →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mySubmissions.map((sub) => (
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
