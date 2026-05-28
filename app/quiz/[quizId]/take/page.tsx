"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import { EXAM_TYPES } from "@/components/quiz-editor"

interface Question {
  id: string
  text: string
  type: string
  options: string | null
  answer: string
  points: number
  order: number
}

interface Quiz {
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
  questions: Question[]
  instructor: { name: string | null }
}

export default function TakeQuizPage({ params }: { params: { quizId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [closed, setClosed] = useState(false)
  const [studentName, setStudentName] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [nameReady, setNameReady] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
  }, [status, router])

  const handleSubmit = useCallback(async () => {
    const unanswered = quiz!.questions.filter((q) => !answers[q.id]?.trim())
    if (unanswered.length > 0) {
      setError(`Please answer all questions (${unanswered.length} remaining)`)
      return
    }
    setSubmitting(true)
    setError("")
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      const res = await fetch(`/api/quizzes/${params.quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.submissionId) {
          setAlreadySubmitted(json.submissionId)
        } else {
          setError(json.error || "Submission failed")
        }
        return
      }
      const nameParam = studentName ? `&name=${encodeURIComponent(studentName)}` : ""
      router.push(`/quiz/${params.quizId}/result?submissionId=${json.submissionId}${nameParam}`)
    } finally {
      setSubmitting(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, answers, params.quizId, router])

  useEffect(() => {
    if (!session) return
    fetch(`/api/quizzes/${params.quizId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found")
        return r.json()
      })
      .then((data) => {
        setQuiz(data)
        // Check if already closed
        if (data.closeAt && new Date() > new Date(data.closeAt)) {
          setClosed(true)
        }
        if (data.timeLimit) {
          const secs = data.timeLimit * 60
          setSecondsLeft(secs)
        }
        setLoading(false)
      })
      .catch(() => router.push("/browse"))
  }, [session, params.quizId, router])

  // Countdown timer
  useEffect(() => {
    if (secondsLeft === null) return
    if (secondsLeft <= 0) {
      handleSubmit()
      return
    }
    timerRef.current = setInterval(() => setSecondsLeft((s) => (s !== null ? s - 1 : null)), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [secondsLeft, handleSubmit])

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (closed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Quiz Closed</h2>
        <p className="text-gray-500 text-sm mb-6">This quiz is no longer accepting submissions.</p>
        <Link href="/browse" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700">
          Browse other quizzes
        </Link>
      </div>
    )
  }

  if (alreadySubmitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">✋</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Already submitted</h2>
        <p className="text-gray-500 text-sm mb-6">You&apos;ve already taken this quiz.</p>
        <Link
          href={`/quiz/${params.quizId}/result?submissionId=${alreadySubmitted}`}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          View your result
        </Link>
      </div>
    )
  }

  if (!quiz) return null

  // Name capture screen
  if (quiz.collectName && !nameReady) {
    const welcomeTemplate = quiz.namePrompt || `Welcome! Good luck on your ${quiz.mode === "EXAM" ? "exam" : "quiz"}.`
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-4xl mb-4">👋</div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">{quiz.title}</h1>
          <p className="text-sm text-gray-500 mb-6">By {quiz.instructor.name}</p>
          <p className="text-sm font-medium text-gray-700 mb-4">What is your name?</p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && nameInput.trim()) {
                setStudentName(nameInput.trim())
                setNameReady(true)
              }
            }}
            placeholder="Enter your name…"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 text-center text-base mb-4"
            autoFocus
          />
          <button
            onClick={() => {
              if (nameInput.trim()) {
                setStudentName(nameInput.trim())
                setNameReady(true)
              }
            }}
            disabled={!nameInput.trim()}
            className="w-full bg-violet-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 transition-colors"
          >
            Start {quiz.mode === "EXAM" ? "Exam" : "Quiz"} →
          </button>
        </div>
      </div>
    )
  }

  // Welcome banner shown after name entry (first render of quiz)
  const welcomeMessage = quiz.collectName && studentName
    ? (quiz.namePrompt || `Welcome! Good luck on your ${quiz.mode === "EXAM" ? "exam" : "quiz"}.`).replace("{name}", studentName)
    : null

  const answered = Object.values(answers).filter((v) => v.trim()).length
  const total = quiz.questions.length
  const totalPoints = quiz.questions.reduce((s, q) => s + q.points, 0)
  const examMeta = EXAM_TYPES.find((e) => e.value === quiz.examType)
  const isExam = quiz.mode === "EXAM"
  const hasPassage = !!quiz.passage?.trim()

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0")
    const s = (secs % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const QuestionList = (
    <div className="space-y-5">
      {quiz.questions.map((question, index) => {
        const options: string[] = question.options ? JSON.parse(question.options) : []
        const isAnswered = !!answers[question.id]?.trim()
        const isSurvey = question.type === "SURVEY"
        const isTrueFalse = question.type === "TRUE_FALSE"
        const isFillBlank = question.type === "FILL_BLANK"

        const surveyFormat = question.answer || "text"
        const surveyOptions: string[] =
          surveyFormat === "yes-no" ? ["Yes", "No"] :
          surveyFormat === "agree" ? ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"] :
          surveyFormat === "rating" ? ["1 ⭐", "2 ⭐", "3 ⭐", "4 ⭐", "5 ⭐"] :
          []

        return (
          <div
            key={question.id}
            className={`bg-white rounded-xl border p-5 shadow-sm transition-colors ${
              isSurvey
                ? isAnswered ? "border-teal-200" : "border-gray-200"
                : isAnswered ? "border-indigo-200" : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-2">
                <span className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSurvey ? "text-teal-500 bg-teal-50" : "text-indigo-500 bg-indigo-50"}`}>
                  {index + 1}
                </span>
                <div>
                  {isSurvey && <span className="text-xs text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded font-medium mr-2">Opinion</span>}
                  {isTrueFalse && <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium mr-2">True/False</span>}
                  {isFillBlank && <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-medium mr-2">Fill in the Blank</span>}
                  <span className="text-sm font-medium text-gray-800">{question.text}</span>
                </div>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-3">{question.points}pt{question.points !== 1 ? "s" : ""}</span>
            </div>

            {question.type === "MULTIPLE_CHOICE" ? (
              <div className="space-y-2 ml-8">
                {options.filter((o) => o.trim()).map((option, i) => (
                  <label key={i} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${answers[question.id] === option ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name={`q-${question.id}`} value={option} checked={answers[question.id] === option} onChange={() => setAnswers((a) => ({ ...a, [question.id]: option }))} className="text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : isTrueFalse ? (
              <div className="flex gap-3 ml-8">
                {["True", "False"].map((opt) => (
                  <label key={opt} className={`flex items-center gap-2 px-5 py-3 rounded-lg cursor-pointer border transition-colors ${answers[question.id] === opt ? "border-emerald-400 bg-emerald-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name={`q-${question.id}`} value={opt} checked={answers[question.id] === opt} onChange={() => setAnswers((a) => ({ ...a, [question.id]: opt }))} className="text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm font-medium text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            ) : question.type === "SURVEY" && surveyOptions.length > 0 ? (
              <div className="space-y-2 ml-8">
                {surveyOptions.map((option, i) => (
                  <label key={i} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${answers[question.id] === option ? "border-teal-400 bg-teal-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name={`q-${question.id}`} value={option} checked={answers[question.id] === option} onChange={() => setAnswers((a) => ({ ...a, [question.id]: option }))} className="text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="ml-8">
                {isFillBlank && <p className="text-xs text-orange-600 mb-2">Fill in the blank: {question.text.includes("___") ? "answer the missing word" : "provide the answer"}</p>}
                <input
                  type="text"
                  value={answers[question.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [question.id]: e.target.value }))}
                  placeholder={isSurvey ? "Share your thoughts…" : isFillBlank ? "Your answer for the blank…" : "Your answer…"}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isSurvey ? "border-teal-200 focus:ring-teal-400" : isFillBlank ? "border-orange-200 focus:ring-orange-400" : "border-gray-300 focus:ring-indigo-500"}`}
                />
              </div>
            )}
          </div>
        )
      })}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-gray-500">{total - answered} question{total - answered !== 1 ? "s" : ""} remaining</span>
        <button onClick={handleSubmit} disabled={submitting} className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
          {submitting ? "Submitting…" : isExam ? "Submit Exam" : "Submit Quiz"}
        </button>
      </div>
    </div>
  )

  const Header = (
    <div className="mb-6">
      <div className="flex items-start justify-between mb-3">
        <Link href="/browse" className="text-sm text-gray-400 hover:text-gray-600">← Back to browse</Link>
        {secondsLeft !== null && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${secondsLeft < 60 ? "bg-red-100 text-red-700 animate-pulse" : secondsLeft < 300 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
            ⏱ {formatTime(secondsLeft)}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mb-1">
        {examMeta && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{examMeta.emoji} {examMeta.label}</span>}
        {isExam && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">Exam · Pass: {quiz.passingScore ?? 60}%</span>}
      </div>
      {welcomeMessage && (
        <div className="mb-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-sm text-violet-800 font-medium">
          {welcomeMessage}
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
      {quiz.description && <p className="text-gray-500 text-sm mt-1">{quiz.description}</p>}
      <div className="flex gap-4 text-xs text-gray-400 mt-2">
        <span>By {quiz.instructor.name}</span>
        <span>{total} questions</span>
        <span>{totalPoints} points</span>
        {quiz.timeLimit && <span>{quiz.timeLimit} min time limit</span>}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{answered} of {total} answered</span>
          <span>{Math.round((answered / total) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
      </div>
    </div>
  )

  if (hasPassage) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Top header bar */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <Link href="/browse" className="text-sm text-gray-400 hover:text-gray-600">← Back</Link>
              <div className="flex items-center gap-3">
                {examMeta && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{examMeta.emoji} {examMeta.label}</span>}
                {isExam && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">Pass: {quiz.passingScore ?? 60}%</span>}
                {secondsLeft !== null && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${secondsLeft < 60 ? "bg-red-100 text-red-700 animate-pulse" : secondsLeft < 300 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
                    ⏱ {formatTime(secondsLeft)}
                  </div>
                )}
              </div>
            </div>
            <h1 className="text-lg font-bold text-gray-900">{welcomeMessage ? `${welcomeMessage} — ` : ""}{quiz.title}</h1>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex gap-3 text-xs text-gray-400">
                <span>{total} questions · {totalPoints} pts</span>
                {quiz.timeLimit && <span>{quiz.timeLimit} min</span>}
              </div>
              <div className="flex-1 max-w-xs">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(answered / total) * 100}%` }} />
                </div>
              </div>
              <span className="text-xs text-gray-500">{answered}/{total} answered</span>
            </div>
          </div>
        </div>

        {/* Split view */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 gap-4 min-h-0">
          {/* Passage panel */}
          <div className="lg:w-1/2 flex flex-col min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-amber-50 flex-shrink-0">
              <span className="text-base">📖</span>
              <span className="text-sm font-semibold text-amber-800">Reading Passage</span>
              <span className="ml-auto text-xs text-amber-600">Scroll to read</span>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-line text-sm">
                {quiz.passage}
              </div>
            </div>
          </div>

          {/* Questions panel */}
          <div className="lg:w-1/2 overflow-y-auto flex-1 min-h-0 pb-4 lg:max-h-full" style={{ maxHeight: "100%" }}>
            {QuestionList}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {Header}
      {QuestionList}
    </div>
  )
}
