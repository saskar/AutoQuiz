"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { EXAM_TYPES } from "@/components/quiz-editor"

interface Quiz {
  id: string
  title: string
  description: string | null
  examType: string
  timeLimit: number | null
  createdAt: string
  _count: { questions: number }
  instructor: { name: string | null; image: string | null }
}

export default function BrowsePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  useEffect(() => {
    if (!session) return
    fetch("/api/quizzes")
      .then((r) => r.json())
      .then((data) => {
        setQuizzes(Array.isArray(data) ? data : [])
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

  const filtered = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.description?.toLowerCase().includes(search.toLowerCase()) ||
      q.instructor.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse Quizzes</h1>
        <p className="text-sm text-gray-500">{quizzes.length} published quiz{quizzes.length !== 1 ? "es" : ""} available</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quizzes or instructors…"
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">
            {quizzes.length === 0
              ? "No published quizzes yet. Be the first to create one!"
              : "No quizzes match your search."}
          </p>
          {quizzes.length === 0 && (
            <Link
              href="/quiz/create"
              className="mt-3 inline-block text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Create a quiz →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((quiz) => {
            const examMeta = EXAM_TYPES.find((e) => e.value === quiz.examType)
            return (
            <div key={quiz.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 flex-1 pr-2">{quiz.title}</h3>
                {examMeta && (
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    {examMeta.emoji} {examMeta.label}
                  </span>
                )}
              </div>
              {quiz.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{quiz.description}</p>
              )}
              <div className="flex items-center gap-2 mt-auto mb-4 flex-wrap">
                {quiz.instructor.image && (
                  <Image
                    src={quiz.instructor.image}
                    alt={quiz.instructor.name ?? ""}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                )}
                <span className="text-xs text-gray-400">{quiz.instructor.name}</span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">{quiz._count.questions} questions</span>
                {quiz.timeLimit && (
                  <>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">⏱ {quiz.timeLimit} min</span>
                  </>
                )}
              </div>
              <Link
                href={`/quiz/${quiz.id}/take`}
                className="block text-center bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Take Quiz
              </Link>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
