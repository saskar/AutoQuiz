"use client"

import { useState, useRef } from "react"

type QuestionType = "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "SURVEY"

export interface QuestionForm {
  text: string
  type: QuestionType
  options: string[]
  answer: string
  points: number
}

export interface QuizSaveData {
  title: string
  description: string
  examType: string
  timeLimit: number | null
  questions: QuestionForm[]
  published: boolean
}

interface QuizEditorProps {
  initialTitle?: string
  initialDescription?: string
  initialExamType?: string
  initialTimeLimit?: number | null
  initialQuestions?: QuestionForm[]
  onSave: (data: QuizSaveData) => Promise<void>
  saving: boolean
  saveError?: string
}

export const EXAM_TYPES = [
  { value: "QUIZ", label: "Quiz", emoji: "📝" },
  { value: "PRACTICE", label: "Practice Test", emoji: "✏️" },
  { value: "DIAGNOSTIC", label: "Diagnostic Exam", emoji: "🔍" },
  { value: "CHAPTER", label: "Chapter Test", emoji: "📖" },
  { value: "MIDTERM", label: "Midterm Exam", emoji: "📋" },
  { value: "FINAL", label: "Final Exam", emoji: "🎓" },
  { value: "PLACEMENT", label: "Placement Exam", emoji: "📊" },
  { value: "ASSESSMENT", label: "Assessment", emoji: "✅" },
  { value: "REVIEW", label: "Review Test", emoji: "🔄" },
  { value: "HOMEWORK", label: "Homework", emoji: "📚" },
]

function emptyQuestion(): QuestionForm {
  return { text: "", type: "MULTIPLE_CHOICE", options: ["", "", "", ""], answer: "", points: 1 }
}

export function QuizEditor({
  initialTitle = "",
  initialDescription = "",
  initialExamType = "QUIZ",
  initialTimeLimit = null,
  initialQuestions,
  onSave,
  saving,
  saveError,
}: QuizEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [examType, setExamType] = useState(initialExamType)
  const [timeLimit, setTimeLimit] = useState<string>(initialTimeLimit ? String(initialTimeLimit) : "")
  const [questions, setQuestions] = useState<QuestionForm[]>(
    initialQuestions?.length ? initialQuestions : [emptyQuestion()]
  )
  const [error, setError] = useState("")
  const [showAI, setShowAI] = useState(false)

  const updateQuestion = (index: number, update: Partial<QuestionForm>) =>
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...update } : q)))

  const moveQuestion = (index: number, dir: "up" | "down") => {
    const next = dir === "up" ? index - 1 : index + 1
    if (next < 0 || next >= questions.length) return
    const copy = [...questions]
    ;[copy[index], copy[next]] = [copy[next], copy[index]]
    setQuestions(copy)
  }

  const validate = () => {
    if (!title.trim()) return "Title is required"
    if (questions.length === 0) return "Add at least one question"
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) return `Question ${i + 1}: text is required`
      if (q.type === "SURVEY") continue
      if (!q.answer.trim()) return `Question ${i + 1}: correct answer is required`
      if (q.type === "MULTIPLE_CHOICE") {
        const filled = q.options.filter((o) => o.trim())
        if (filled.length < 2) return `Question ${i + 1}: need at least 2 options`
        if (!q.options.includes(q.answer))
          return `Question ${i + 1}: correct answer must match one of the options`
      }
    }
    return null
  }

  const handleSave = async (published: boolean) => {
    const err = validate()
    if (err) { setError(err); return }
    setError("")
    await onSave({
      title,
      description,
      examType,
      timeLimit: timeLimit ? Number(timeLimit) : null,
      questions,
      published,
    })
  }

  const addGeneratedQuestions = (generated: QuestionForm[], replace: boolean) => {
    if (replace) {
      setQuestions(generated)
    } else {
      setQuestions((qs) => [...qs, ...generated])
    }
    setShowAI(false)
  }

  const totalPoints = questions.reduce((s, q) => s + (Number(q.points) || 0), 0)
  const examMeta = EXAM_TYPES.find((e) => e.value === examType)

  return (
    <div className="space-y-5">
      {/* Quiz metadata */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Quiz Details</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Algebra Midterm — Chapter 4 & 5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {EXAM_TYPES.map((et) => (
                  <option key={et.value} value={et.value}>
                    {et.emoji} {et.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit <span className="text-gray-400 font-normal">(minutes, optional)</span>
              </label>
              <input
                type="number"
                min={1}
                max={480}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="e.g. 60"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions, topics covered, notes for students…"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* AI Generator */}
      {showAI ? (
        <AIGeneratorPanel
          examType={examType}
          onAdd={addGeneratedQuestions}
          onClose={() => setShowAI(false)}
          currentCount={questions.length}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAI(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-200 rounded-xl text-sm font-medium text-indigo-700 hover:from-violet-100 hover:to-indigo-100 transition-colors"
        >
          <span className="text-lg">✨</span>
          Generate Questions with AI
        </button>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.length > 0 && (
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Questions ({questions.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                if (confirm("Remove all questions?")) setQuestions([emptyQuestion()])
              }}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Clear all
            </button>
          </div>
        )}
        {questions.map((q, index) => (
          <QuestionCard
            key={index}
            index={index}
            question={q}
            total={questions.length}
            onChange={(update) => updateQuestion(index, update)}
            onRemove={() => setQuestions((qs) => qs.filter((_, i) => i !== index))}
            onMove={(dir) => moveQuestion(index, dir)}
            onDuplicate={() =>
              setQuestions((qs) => [
                ...qs.slice(0, index + 1),
                { ...q },
                ...qs.slice(index + 1),
              ])
            }
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        + Add Question Manually
      </button>

      {(error || saveError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error || saveError}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          {questions.length} question{questions.length !== 1 ? "s" : ""} ·{" "}
          {totalPoints} total point{totalPoints !== 1 ? "s" : ""}
          {timeLimit ? ` · ${timeLimit} min` : ""}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AI Generator Panel ──────────────────────────────────────────────────────

const DIFFICULTIES = ["easy", "medium", "hard"]
const GRADE_LEVELS = [
  "Elementary (K-5)",
  "Middle School (6-8)",
  "High School (9-12)",
  "Undergraduate",
  "Graduate",
  "Professional",
  "General",
]
const Q_COUNTS = [5, 10, 15, 20, 25, 30, 40, 50]

interface AIGeneratorPanelProps {
  examType: string
  currentCount: number
  onAdd: (questions: QuestionForm[], replace: boolean) => void
  onClose: () => void
}

function AIGeneratorPanel({ examType, currentCount, onAdd, onClose }: AIGeneratorPanelProps) {
  const [topic, setTopic] = useState("")
  const [subject, setSubject] = useState("")
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState("medium")
  const [gradeLevel, setGradeLevel] = useState("High School (9-12)")
  const [questionTypes, setQuestionTypes] = useState("mixed")
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState("")
  const [preview, setPreview] = useState<QuestionForm[] | null>(null)

  const generate = async () => {
    if (!topic.trim()) { setGenError("Enter a topic first"); return }
    setGenerating(true)
    setGenError("")
    setPreview(null)

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, subject, examType, questionCount: count, difficulty, gradeLevel, questionTypes }),
      })
      const json = await res.json()
      if (!res.ok) { setGenError(json.error || "Generation failed"); return }
      setPreview(json.questions)
    } catch {
      setGenError("Network error — please try again")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-indigo-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h3 className="font-semibold text-gray-800">AI Question Generator</h3>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            Powered by Claude
          </span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!preview ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Topic / Subject Matter <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. The French Revolution, Quadratic Equations, Photosynthesis"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Course / Subject (optional)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. AP Chemistry, 8th Grade Math"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Grade / Level</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {GRADE_LEVELS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Number of Questions</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {Q_COUNTS.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                      difficulty === d
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Question Types</label>
              <div className="flex gap-2">
                {[
                  { value: "mixed", label: "Mixed" },
                  { value: "MULTIPLE_CHOICE", label: "MC Only" },
                  { value: "SHORT_ANSWER", label: "SA Only" },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setQuestionTypes(t.value)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      questionTypes === t.value
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {genError && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{genError}</p>
          )}

          <button
            type="button"
            onClick={generate}
            disabled={generating || !topic.trim()}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Generating {count} questions…
              </>
            ) : (
              <>✨ Generate {count} Questions</>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Generated {preview.length} questions — review and add them:
            </p>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {preview.map((q, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-gray-800 flex-1">{i + 1}. {q.text}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">
                    {q.type === "MULTIPLE_CHOICE" ? "MC" : "SA"}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">✓ {q.answer}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            {currentCount > 0 && (
              <button
                type="button"
                onClick={() => onAdd(preview, false)}
                className="flex-1 py-2.5 border border-indigo-300 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors"
              >
                + Add to existing ({currentCount + preview.length} total)
              </button>
            )}
            <button
              type="button"
              onClick={() => onAdd(preview, true)}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {currentCount > 0 ? "Replace all questions" : "Use these questions"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Question Card ────────────────────────────────────────────────────────────

interface QuestionCardProps {
  index: number
  question: QuestionForm
  total: number
  onChange: (update: Partial<QuestionForm>) => void
  onRemove: () => void
  onMove: (dir: "up" | "down") => void
  onDuplicate: () => void
}

function QuestionCard({ index, question, total, onChange, onRemove, onMove, onDuplicate }: QuestionCardProps) {
  const [collapsed, setCollapsed] = useState(false)

  const updateOption = (i: number, value: string) => {
    const options = [...question.options]
    const wasAnswer = question.answer === options[i]
    options[i] = value
    onChange({ options, answer: wasAnswer ? value : question.answer })
  }

  const filledOptions = question.options.filter((o) => o.trim())
  const isValid =
    question.text.trim() &&
    question.answer.trim() &&
    (question.type === "SHORT_ANSWER" || filledOptions.length >= 2)

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm transition-colors ${
        isValid ? "border-gray-200" : "border-amber-200"
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <div className="flex flex-col gap-0.5">
          <button type="button" onClick={() => onMove("up")} disabled={index === 0} className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <button type="button" onClick={() => onMove("down")} disabled={index === total - 1} className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
        <span className="text-xs font-bold text-gray-400 w-5 text-center">{index + 1}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            question.type === "MULTIPLE_CHOICE"
              ? "bg-blue-50 text-blue-600"
              : question.type === "SURVEY"
              ? "bg-teal-50 text-teal-600"
              : "bg-purple-50 text-purple-600"
          }`}
        >
          {question.type === "MULTIPLE_CHOICE" ? "MC" : question.type === "SURVEY" ? "Survey" : "SA"}
        </span>
        <p className="flex-1 text-xs text-gray-600 truncate min-w-0">
          {question.text || <span className="text-gray-300 italic">No question text</span>}
        </p>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-gray-400">{question.points}pt</span>
          <button type="button" onClick={() => setCollapsed((c) => !c)} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card body */}
      {!collapsed && (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <select
              value={question.type}
              onChange={(e) =>
                onChange({
                  type: e.target.value as QuestionType,
                  options: ["", "", "", ""],
                  answer: "",
                })
              }
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
            >
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="SHORT_ANSWER">Short Answer</option>
              <option value="SURVEY">Opinion / Survey</option>
            </select>
            <div className="flex items-center gap-1.5 ml-auto">
              <label className="text-xs text-gray-500">Points</label>
              <input
                type="number"
                min={1}
                max={100}
                value={question.points}
                onChange={(e) => onChange({ points: Number(e.target.value) })}
                className="w-14 text-xs border border-gray-200 rounded-md px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <button type="button" onClick={onDuplicate} className="text-xs text-gray-400 hover:text-indigo-600 px-2 py-1.5 border border-gray-200 rounded-md hover:border-indigo-300 transition-colors">
              Copy
            </button>
            <button type="button" onClick={onRemove} disabled={total === 1} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 border border-gray-200 rounded-md hover:border-red-300 disabled:opacity-30 transition-colors">
              Delete
            </button>
          </div>

          <textarea
            value={question.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder={`Question ${index + 1} text…`}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />

          {question.type === "MULTIPLE_CHOICE" ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Options — select the correct answer</p>
              {question.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`answer-${index}`}
                    checked={question.answer === opt && opt.trim() !== ""}
                    onChange={() => opt.trim() && onChange({ answer: opt })}
                    className="text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              {question.answer && (
                <p className="text-xs text-green-600">✓ Correct: <strong>{question.answer}</strong></p>
              )}
            </div>
          ) : question.type === "SURVEY" ? (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <p className="text-xs text-blue-700 font-medium">Opinion / Survey question</p>
                <p className="text-xs text-blue-500 mt-0.5">Any non-empty response receives full points. Use for gathering student opinions, self-assessments, or open-ended reflections.</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Answer format</label>
                <select
                  value={question.answer || "text"}
                  onChange={(e) => onChange({ answer: e.target.value, options: e.target.value === "text" ? [] : ["Yes", "No", "", ""] })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                >
                  <option value="text">Free text input</option>
                  <option value="yes-no">Yes / No</option>
                  <option value="agree">Strongly Agree to Strongly Disagree</option>
                  <option value="rating">Rating (1–5)</option>
                </select>
              </div>
              {question.answer === "yes-no" && (
                <div className="flex gap-2 text-xs text-gray-400">
                  <span className="bg-gray-100 px-3 py-1.5 rounded-lg">Yes</span>
                  <span className="bg-gray-100 px-3 py-1.5 rounded-lg">No</span>
                </div>
              )}
              {question.answer === "agree" && (
                <div className="flex gap-1 flex-wrap text-xs text-gray-400">
                  {["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"].map(o => (
                    <span key={o} className="bg-gray-100 px-2 py-1.5 rounded-lg">{o}</span>
                  ))}
                </div>
              )}
              {question.answer === "rating" && (
                <div className="flex gap-2 text-xs text-gray-400">
                  {["1 ⭐", "2 ⭐", "3 ⭐", "4 ⭐", "5 ⭐"].map(o => (
                    <span key={o} className="bg-gray-100 px-2 py-1.5 rounded-lg">{o}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Expected Answer (case-insensitive match)</label>
              <input
                type="text"
                value={question.answer}
                onChange={(e) => onChange({ answer: e.target.value })}
                placeholder="Accepted correct answer"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
