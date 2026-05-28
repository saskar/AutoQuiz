"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { QuizEditor, type QuizSaveData } from "@/components/quiz-editor"
import Link from "next/link"

interface QuizData {
  id: string
  title: string
  description: string | null
  examType: string
  mode: string
  passingScore: number | null
  closeAt: string | null
  timeLimit: number | null
  passage: string | null
  collectName: boolean
  namePrompt: string | null
  published: boolean
  questions: Array<{
    id: string
    text: string
    type: string
    options: string | null
    answer: string
    points: number
    order: number
  }>
}

export default function EditQuizPage({ params }: { params: { quizId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const justCreated = searchParams.get("created") === "1"

  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(justCreated)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  useEffect(() => {
    if (!session) return
    fetch(`/api/quizzes/${params.quizId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found")
        return r.json()
      })
      .then((data) => {
        setQuiz(data)
        setLoading(false)
      })
      .catch(() => router.push("/dashboard"))
  }, [session, params.quizId, router])

  const handleSave = async (data: QuizSaveData) => {
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      const res = await fetch(`/api/quizzes/${params.quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || "Failed to save")
        return
      }
      const updated = await res.json()
      setQuiz(updated)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!quiz) return null

  const initialQuestions = quiz.questions
    .sort((a, b) => a.order - b.order)
    .map((q) => ({
      text: q.text,
      type: q.type as "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "SURVEY" | "TRUE_FALSE" | "FILL_BLANK",
      options: q.options ? JSON.parse(q.options) : (q.type === "TRUE_FALSE" ? ["True", "False"] : []),
      answer: q.answer,
      points: q.points,
    }))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Edit {quiz.mode === "EXAM" ? "Exam" : "Quiz"}
            </h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                quiz.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {quiz.published ? "Published" : "Draft"}
            </span>
          </div>
        </div>
        {quiz.published && (
          <Link
            href={`/quiz/${quiz.id}/results`}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View Results →
          </Link>
        )}
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          Saved successfully!
        </div>
      )}

      <QuizEditor
        initialTitle={quiz.title}
        initialDescription={quiz.description ?? ""}
        initialExamType={quiz.examType}
        initialMode={quiz.mode}
        initialPassingScore={quiz.passingScore}
        initialCloseAt={quiz.closeAt}
        initialTimeLimit={quiz.timeLimit}
        initialPassage={quiz.passage ?? ""}
        initialCollectName={quiz.collectName}
        initialNamePrompt={quiz.namePrompt ?? ""}
        initialPublished={quiz.published}
        initialQuestions={initialQuestions}
        onSave={handleSave}
        saving={saving}
        saveError={error}
      />
    </div>
  )
}
