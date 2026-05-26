"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface Submission {
  id: string
  score: number
  earnedPoints: number
  totalPoints: number
  submittedAt: string
  student: { name: string | null; image: string | null; email: string | null }
}

interface QuizMeta {
  title: string
  published: boolean
  _count: { questions: number }
}

function ScorePill({ score }: { score: number }) {
  const cls =
    score >= 70 ? "bg-green-100 text-green-700" :
    score >= 50 ? "bg-amber-100 text-amber-700" :
    "bg-red-100 text-red-700"
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {Math.round(score)}/100
    </span>
  )
}

export default function QuizResultsPage({ params }: { params: { quizId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [quiz, setQuiz] = useState<QuizMeta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  useEffect(() => {
    if (!session) return
    Promise.all([
      fetch(`/api/quizzes/${params.quizId}`).then((r) => r.json()),
      fetch(`/api/submissions?quizId=${params.quizId}`).then((r) => r.json()),
    ])
      .then(([quizData, subs]) => {
        setQuiz(quizData)
        setSubmissions(Array.isArray(subs) ? subs : [])
        setLoading(false)
      })
      .catch(() => router.push("/dashboard"))
  }, [session, params.quizId, router])

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const avg =
    submissions.length > 0
      ? Math.round(submissions.reduce((s, sub) => s + sub.score, 0) / submissions.length)
      : null

  const dist = [
    { label: "90–100", count: submissions.filter((s) => s.score >= 90).length, color: "bg-green-500" },
    { label: "70–89", count: submissions.filter((s) => s.score >= 70 && s.score < 90).length, color: "bg-lime-500" },
    { label: "50–69", count: submissions.filter((s) => s.score >= 50 && s.score < 70).length, color: "bg-amber-500" },
    { label: "0–49", count: submissions.filter((s) => s.score < 50).length, color: "bg-red-500" },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{quiz?.title}</h1>
          <p className="text-sm text-gray-500">{quiz?._count?.questions} questions · {submissions.length} submission{submissions.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href={`/quiz/${params.quizId}/edit`}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Edit Quiz
        </Link>
      </div>

      {/* Stats */}
      {submissions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-indigo-600">{avg}</div>
            <div className="text-xs text-gray-400">Avg score</div>
          </div>
          {dist.map((d) => (
            <div key={d.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
              <div className="text-2xl font-bold text-gray-900">{d.count}</div>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${d.color}`}></span>
                <span className="text-xs text-gray-400">{d.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submissions table */}
      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">No submissions yet.</p>
          {!quiz?.published && (
            <p className="text-gray-400 text-xs mt-2">
              This quiz is a draft.{" "}
              <Link href={`/quiz/${params.quizId}/edit`} className="text-indigo-600">
                Publish it
              </Link>{" "}
              so students can take it.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Points</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {sub.student.image && (
                        <Image
                          src={sub.student.image}
                          alt={sub.student.name ?? ""}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 text-xs">{sub.student.name}</div>
                        {sub.student.email && (
                          <div className="text-xs text-gray-400">{sub.student.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ScorePill score={sub.score} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {sub.earnedPoints}/{sub.totalPoints}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/quiz/${params.quizId}/result?submissionId=${sub.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
