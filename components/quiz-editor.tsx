"use client"

import { useState } from "react"

type QuestionType = "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "SURVEY" | "TRUE_FALSE" | "FILL_BLANK"

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
  mode: string
  passingScore: number | null
  closeAt: string | null
  timeLimit: number | null
  passage: string
  collectName: boolean
  namePrompt: string
  questions: QuestionForm[]
  published: boolean
}

interface QuizEditorProps {
  initialTitle?: string
  initialDescription?: string
  initialExamType?: string
  initialMode?: string
  initialPassingScore?: number | null
  initialCloseAt?: string | null
  initialTimeLimit?: number | null
  initialPassage?: string
  initialCollectName?: boolean
  initialNamePrompt?: string
  initialPublished?: boolean
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

const SUBJECT_GROUPS = [
  {
    group: "English",
    subjects: [
      "English Reading Comprehension",
      "English Grammar & Writing",
      "English Vocabulary",
      "English Literature",
      "English Spelling & Phonics",
    ],
  },
  {
    group: "Arabic Language (اللغة العربية)",
    subjects: [
      "الفهم القرائي — Arabic Reading Comprehension",
      "النحو والصرف — Arabic Grammar",
      "التعبير الكتابي — Arabic Writing",
      "المفردات والإملاء — Arabic Vocabulary & Spelling",
      "الأدب العربي — Arabic Literature",
      "الخط العربي — Arabic Calligraphy",
      "البلاغة — Arabic Rhetoric",
    ],
  },
  {
    group: "Islamic Studies (التربية الإسلامية)",
    subjects: [
      "القرآن الكريم — Quran Studies",
      "الحديث النبوي — Hadith Studies",
      "العقيدة الإسلامية — Islamic Creed (Aqeedah)",
      "الفقه الإسلامي — Islamic Jurisprudence (Fiqh)",
      "السيرة النبوية — Prophetic Biography (Seerah)",
      "التاريخ الإسلامي — Islamic History",
      "الأخلاق الإسلامية — Islamic Ethics & Morals",
      "تفسير القرآن — Quran Tafseer (Exegesis)",
    ],
  },
  {
    group: "Civics & Social Studies",
    subjects: [
      "Civics & Government",
      "Constitutional Rights",
      "World Cultures & Societies",
      "Economics & Financial Literacy",
      "Community & Social Responsibility",
      "Human Rights & Global Citizenship",
      "Media Literacy & Critical Thinking",
    ],
  },
  {
    group: "Mathematics",
    subjects: [
      "Mathematics — Arithmetic & Number Sense",
      "Mathematics — Algebra",
      "Mathematics — Geometry",
      "Mathematics — Statistics & Probability",
      "Mathematics — Calculus",
      "Mathematics — Trigonometry",
      "Mathematics — Discrete Math",
    ],
  },
  {
    group: "Science",
    subjects: [
      "Science — Biology",
      "Science — Chemistry",
      "Science — Physics",
      "Science — Earth & Environmental Science",
      "Science — Anatomy & Human Body",
      "Science — Astronomy & Space",
      "Science — Ecology & Conservation",
    ],
  },
  {
    group: "History & Geography",
    subjects: [
      "History — World History",
      "History — Middle Eastern History",
      "History — Islamic Golden Age",
      "History — Ancient Civilizations",
      "History — Modern World",
      "Geography — World Geography",
      "Geography — Physical Geography",
    ],
  },
  {
    group: "Technology",
    subjects: [
      "Computer Science — Programming",
      "Computer Science — Data Structures",
      "Computer Science — Cybersecurity",
      "Digital Literacy & Internet Safety",
      "Artificial Intelligence Basics",
      "Computer Networks & Systems",
    ],
  },
  {
    group: "Other Languages",
    subjects: ["French Language", "Spanish Language", "German Language", "Chinese (Mandarin)"],
  },
  {
    group: "Arts & Music",
    subjects: ["Visual Arts & Art History", "Music Theory", "Drama & Theater", "Creative Writing"],
  },
]

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "intermediate", label: "Intermediate" },
  { value: "hard", label: "Hard" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
]

const Q_QUICK_PICKS = [5, 10, 15, 20, 25, 30]

function emptyQuestion(): QuestionForm {
  return { text: "", type: "MULTIPLE_CHOICE", options: ["", "", "", ""], answer: "", points: 1 }
}

function toTimeInput(closeAt: string | null): string {
  if (!closeAt) return ""
  try {
    const d = new Date(closeAt)
    if (!isNaN(d.getTime())) {
      return d.toTimeString().slice(0, 5)
    }
    return closeAt.slice(0, 5)
  } catch {
    return ""
  }
}

function timeInputToISO(timeStr: string): string | null {
  if (!timeStr) return null
  const now = new Date()
  const parts = timeStr.split(":")
  now.setHours(Number(parts[0]), Number(parts[1]), 0, 0)
  return now.toISOString()
}

export function QuizEditor({
  initialTitle = "",
  initialDescription = "",
  initialExamType = "QUIZ",
  initialMode = "QUIZ",
  initialPassingScore = null,
  initialCloseAt = null,
  initialTimeLimit = null,
  initialPassage = "",
  initialCollectName = false,
  initialNamePrompt = "",
  initialPublished = false,
  initialQuestions,
  onSave,
  saving,
  saveError,
}: QuizEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [examType, setExamType] = useState(initialExamType)
  const [mode, setMode] = useState<"QUIZ" | "EXAM">(initialMode === "EXAM" ? "EXAM" : "QUIZ")
  const [passingScore, setPassingScore] = useState<string>(
    initialPassingScore ? String(initialPassingScore) : "60"
  )
  const [closeAtTime, setCloseAtTime] = useState<string>(toTimeInput(initialCloseAt))
  const [timeLimit, setTimeLimit] = useState<string>(
    initialTimeLimit ? String(initialTimeLimit) : ""
  )
  const [passage, setPassage] = useState(initialPassage)
  const [collectName, setCollectName] = useState(initialCollectName)
  const [namePrompt, setNamePrompt] = useState(initialNamePrompt)
  const [published, setPublished] = useState(initialPublished)
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
      if (q.type === "TRUE_FALSE") {
        if (q.answer !== "True" && q.answer !== "False")
          return `Question ${i + 1}: select True or False as the answer`
      }
    }
    return null
  }

  const handleSave = async (pub: boolean) => {
    const err = validate()
    if (err) { setError(err); return }
    setError("")
    await onSave({
      title,
      description,
      examType,
      mode,
      passingScore: mode === "EXAM" && passingScore ? Number(passingScore) : null,
      closeAt: timeInputToISO(closeAtTime),
      timeLimit: timeLimit ? Number(timeLimit) : null,
      passage,
      collectName,
      namePrompt,
      questions,
      published: pub,
    })
  }

  const addGeneratedQuestions = (generated: QuestionForm[], replace: boolean, generatedPassage?: string) => {
    if (replace) {
      setQuestions(generated)
    } else {
      setQuestions((qs) => [...qs, ...generated])
    }
    if (generatedPassage) setPassage(generatedPassage)
    setShowAI(false)
  }

  const totalPoints = questions.reduce((s, q) => s + (Number(q.points) || 0), 0)

  return (
    <div className="space-y-5">
      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode("QUIZ")}
          className={`rounded-xl border-2 p-4 text-left transition-colors ${
            mode === "QUIZ"
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <svg
              className={`w-5 h-5 ${mode === "QUIZ" ? "text-indigo-600" : "text-gray-400"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className={`font-semibold text-sm ${mode === "QUIZ" ? "text-indigo-700" : "text-gray-700"}`}>
              Quiz
            </span>
            {mode === "QUIZ" && (
              <span className="ml-auto text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                Selected
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">Casual, shows answers after</p>
        </button>

        <button
          type="button"
          onClick={() => setMode("EXAM")}
          className={`rounded-xl border-2 p-4 text-left transition-colors ${
            mode === "EXAM"
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <svg
              className={`w-5 h-5 ${mode === "EXAM" ? "text-indigo-600" : "text-gray-400"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
              />
            </svg>
            <span className={`font-semibold text-sm ${mode === "EXAM" ? "text-indigo-700" : "text-gray-700"}`}>
              Exam
            </span>
            {mode === "EXAM" && (
              <span className="ml-auto text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                Selected
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">Strict mode with pass/fail</p>
        </button>
      </div>

      {/* Quiz/Exam metadata */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          {mode === "EXAM" ? "Exam" : "Quiz"} Details
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === "EXAM" ? "e.g. Algebra Midterm Exam" : "e.g. Algebra Chapter 4 Quiz"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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

          <div className={`rounded-xl p-4 border ${passage.trim() ? "border-amber-300 bg-amber-50" : "border-dashed border-gray-300 bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">📖</span>
              <label className="block text-sm font-semibold text-gray-700">
                Reading Passage
              </label>
              <span className="text-xs text-gray-400 font-normal">(optional — enables split-view for students)</span>
            </div>
            <textarea
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              placeholder="Paste or type a reading passage here (at least 2–3 paragraphs). Students will see it alongside the questions in a side-by-side view, like SABIS…"
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y bg-white"
            />
            {passage.trim() ? (
              <p className="text-xs text-amber-700 mt-1.5 font-medium">✓ Split-view layout will be shown to students — passage on the left, questions on the right</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1.5">Leave empty for a regular question-only layout. Use AI generator to auto-create a passage for reading comprehension topics.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                Time Limit <span className="text-gray-400 font-normal">(minutes)</span>
              </label>
              <input
                type="number"
                min={1}
                max={480}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="No limit"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto-close at <span className="text-gray-400 font-normal">(time)</span>
              </label>
              <input
                type="time"
                value={closeAtTime}
                onChange={(e) => setCloseAtTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {mode === "EXAM" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Score <span className="text-gray-400 font-normal">(%)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  placeholder="60"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPublished((p) => !p)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  published ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    published ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {published ? "Published" : "Draft"} · Total: <strong>{totalPoints} pts</strong>
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setCollectName((c) => !c)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                    collectName ? "bg-violet-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      collectName ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Address students by name</p>
                  <p className="text-xs text-gray-400">
                    {collectName
                      ? "Students will be greeted by name throughout the quiz"
                      : "Ask for the student's name and personalise the experience"}
                  </p>
                </div>
              </div>

              {collectName && (
                <div className="ml-14 space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Welcome message <span className="text-gray-400 font-normal">(use {"{name}"} to insert their name)</span></label>
                    <input
                      type="text"
                      value={namePrompt}
                      onChange={(e) => setNamePrompt(e.target.value)}
                      placeholder={`Welcome, {name}! Good luck on your ${mode === "EXAM" ? "exam" : "quiz"}.`}
                      className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-2">
                    Preview: <em>{(namePrompt || `Welcome, {name}! Good luck on your ${mode === "EXAM" ? "exam" : "quiz"}.`).replace("{name}", "Ahmed")}</em>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Generator trigger */}
      <button
        type="button"
        onClick={() => setShowAI(true)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-200 rounded-xl text-sm font-medium text-indigo-700 hover:from-violet-100 hover:to-indigo-100 transition-colors"
      >
        <span className="text-lg">✨</span>
        Generate with AI
      </button>

      {/* AI Generator Modal */}
      {showAI && (
        <AIGeneratorModal
          examType={examType}
          mode={mode}
          onAdd={addGeneratedQuestions}
          onClose={() => setShowAI(false)}
          currentCount={questions.length}
        />
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

// ─── AI Generator Modal ───────────────────────────────────────────────────────

interface AIGeneratorModalProps {
  examType: string
  mode: string
  currentCount: number
  onAdd: (questions: QuestionForm[], replace: boolean, passage?: string) => void
  onClose: () => void
}

function AIGeneratorModal({ examType, mode, currentCount, onAdd, onClose }: AIGeneratorModalProps) {
  const [selectedSubject, setSelectedSubject] = useState("")
  const [customTopic, setCustomTopic] = useState("")
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState("medium")
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState("")
  const [preview, setPreview] = useState<QuestionForm[] | null>(null)
  const [previewPassage, setPreviewPassage] = useState<string | null>(null)

  const isCustom = selectedSubject === "__custom__"
  const effectiveTopic = isCustom ? customTopic : selectedSubject

  const generate = async () => {
    if (!effectiveTopic.trim()) {
      setGenError("Choose a subject or enter a custom topic")
      return
    }
    setGenerating(true)
    setGenError("")
    setPreview(null)
    setPreviewPassage(null)

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: effectiveTopic,
          examType,
          questionCount: count,
          difficulty,
          gradeLevel: "High School (9-12)",
          questionTypes: "mixed",
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setGenError(json.error || "Generation failed")
        return
      }
      setPreview(json.questions)
      if (json.passage) setPreviewPassage(json.passage)
    } catch {
      setGenError("Network error — please try again")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>✨</span> AI {mode === "EXAM" ? "Exam" : "Quiz"} Generator
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Choose a subject and level — AI will generate questions automatically.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 ml-4 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!preview ? (
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">— Select a subject —</option>
                  {SUBJECT_GROUPS.map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.subjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="__custom__">✏️ Custom topic…</option>
                </select>
              </div>

              {isCustom && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Topic <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="e.g. The French Revolution, Quadratic Equations…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => e.key === "Enter" && generate()}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {Q_QUICK_PICKS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        count === n
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Custom count (1–100)"
                />
              </div>

              <div className="bg-indigo-50 rounded-lg px-4 py-3 space-y-1">
                <p className="text-xs text-indigo-700">✦ Mix of multiple choice, true/false, short answer &amp; fill-in-blank</p>
                <p className="text-xs text-indigo-700">✦ Review and edit all questions before saving</p>
              </div>

              {genError && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{genError}</p>
              )}

              <button
                type="button"
                onClick={generate}
                disabled={generating || !effectiveTopic.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Generating {count} questions…
                  </>
                ) : (
                  <>✦ Generate {mode === "EXAM" ? "Exam" : "Quiz"}</>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Generated {preview.length} questions{previewPassage ? " + reading passage" : ""} — review and add them:
                </p>
                <button
                  type="button"
                  onClick={() => { setPreview(null); setPreviewPassage(null) }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  ← Back
                </button>
              </div>

              {previewPassage && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-blue-700 mb-1">📖 Reading Passage</p>
                  <p className="text-xs text-blue-900 whitespace-pre-line leading-relaxed">{previewPassage.slice(0, 300)}…</p>
                </div>
              )}

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {preview.map((q, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-gray-800 flex-1">{i + 1}. {q.text}</p>
                      <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded flex-shrink-0">
                        {q.type === "MULTIPLE_CHOICE" ? "MC" : q.type === "TRUE_FALSE" ? "T/F" : q.type === "FILL_BLANK" ? "Fill" : "SA"}
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
                    onClick={() => onAdd(preview, false, previewPassage ?? undefined)}
                    className="flex-1 py-2.5 border border-indigo-300 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors"
                  >
                    + Add to existing
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onAdd(preview, true, previewPassage ?? undefined)}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  {currentCount > 0 ? "Replace all" : "Use these questions"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
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

function getTypeLabel(t: QuestionType): string {
  switch (t) {
    case "MULTIPLE_CHOICE": return "MC"
    case "TRUE_FALSE": return "T/F"
    case "SHORT_ANSWER": return "SA"
    case "FILL_BLANK": return "Fill"
    case "SURVEY": return "Survey"
  }
}

function getTypeBadgeColor(t: QuestionType): string {
  switch (t) {
    case "MULTIPLE_CHOICE": return "bg-blue-50 text-blue-600"
    case "TRUE_FALSE": return "bg-emerald-50 text-emerald-600"
    case "SHORT_ANSWER": return "bg-purple-50 text-purple-600"
    case "FILL_BLANK": return "bg-orange-50 text-orange-600"
    case "SURVEY": return "bg-teal-50 text-teal-600"
  }
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
    (question.type === "SHORT_ANSWER" ||
      question.type === "FILL_BLANK" ||
      question.type === "SURVEY" ||
      question.type === "TRUE_FALSE" ||
      filledOptions.length >= 2)

  return (
    <div className={`bg-white rounded-xl border shadow-sm transition-colors ${isValid ? "border-gray-200" : "border-amber-200"}`}>
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
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeBadgeColor(question.type)}`}>
          {getTypeLabel(question.type)}
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
              onChange={(e) => {
                const newType = e.target.value as QuestionType
                if (newType === "TRUE_FALSE") {
                  onChange({ type: newType, options: ["True", "False"], answer: "" })
                } else if (newType === "MULTIPLE_CHOICE") {
                  onChange({ type: newType, options: ["", "", "", ""], answer: "" })
                } else {
                  onChange({ type: newType, options: [], answer: "" })
                }
              }}
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
            >
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="SHORT_ANSWER">Short Answer</option>
              <option value="FILL_BLANK">Fill in the Blank</option>
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
            placeholder={question.type === "FILL_BLANK" ? `Question ${index + 1} text… (use ___ for the blank)` : `Question ${index + 1} text…`}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />

          {question.type === "FILL_BLANK" && (
            <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-xs text-orange-700">
              Tip: Use <code className="bg-orange-100 px-1 rounded">___</code> in your question text to mark the blank.
            </div>
          )}

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
          ) : question.type === "TRUE_FALSE" ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Select the correct answer</p>
              <div className="flex gap-3">
                {["True", "False"].map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      question.answer === opt
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`answer-${index}`}
                      checked={question.answer === opt}
                      onChange={() => onChange({ answer: opt })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : question.type === "SURVEY" ? (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <p className="text-xs text-blue-700 font-medium">Opinion / Survey question</p>
                <p className="text-xs text-blue-500 mt-0.5">Any non-empty response receives full points.</p>
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
            </div>
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {question.type === "FILL_BLANK" ? "Expected word/phrase for the blank" : "Expected Answer (case-insensitive match)"}
              </label>
              <input
                type="text"
                value={question.answer}
                onChange={(e) => onChange({ answer: e.target.value })}
                placeholder={question.type === "FILL_BLANK" ? "e.g. Paris" : "Accepted correct answer"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
