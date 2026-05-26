import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

const EXAM_TYPE_LABELS: Record<string, string> = {
  QUIZ: "quiz",
  PRACTICE: "practice test",
  DIAGNOSTIC: "diagnostic exam",
  MIDTERM: "midterm exam",
  FINAL: "final exam",
  HOMEWORK: "homework assignment",
  ASSESSMENT: "assessment",
  CHAPTER: "chapter test",
  PLACEMENT: "placement exam",
  REVIEW: "review test",
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const {
    topic,
    examType = "QUIZ",
    questionCount = 10,
    difficulty = "medium",
    gradeLevel = "general",
    questionTypes = "mixed",
    subject,
  } = body

  if (!topic?.trim()) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 })
  }

  const count = Math.min(Math.max(Number(questionCount) || 10, 1), 50)
  const examLabel = EXAM_TYPE_LABELS[examType] ?? "quiz"

  const typeInstruction =
    questionTypes === "SHORT_ANSWER"
      ? "Use SHORT_ANSWER type only. Set options to empty array []."
      : questionTypes === "MULTIPLE_CHOICE"
      ? "Use MULTIPLE_CHOICE type only with exactly 4 options."
      : `Use a natural mix: roughly 70% MULTIPLE_CHOICE and 30% SHORT_ANSWER.`

  const difficultyHint =
    difficulty === "easy"
      ? "Use straightforward recall and comprehension questions."
      : difficulty === "hard"
      ? "Use advanced analysis, synthesis, and critical thinking questions."
      : "Balance recall with application and analysis questions."

  const systemPrompt = `You are an expert educator and exam writer. You create clear, well-structured exam questions following best practices. You always respond with valid JSON only — no markdown fences, no extra text.`

  const userPrompt = `Create ${count} ${difficulty} questions for a ${examLabel} about: "${topic}"${subject ? ` (subject: ${subject})` : ""}
Target audience: ${gradeLevel}

${typeInstruction}
${difficultyHint}

Return a JSON array only. Each item must follow this schema exactly:
{
  "text": "Full question text",
  "type": "MULTIPLE_CHOICE" | "SHORT_ANSWER",
  "options": ["A", "B", "C", "D"],  // empty [] for SHORT_ANSWER
  "answer": "exact correct answer",  // must match one option for MC
  "points": 1  // integer 1-5 reflecting difficulty
}

Important rules:
- Multiple choice: exactly 4 distinct options, answer must exactly match one option string
- Short answer: concise expected answer, options must be []
- All questions must be factually accurate and unambiguous
- Vary question styles (define, explain, calculate, compare, identify, etc.)
- Return only the JSON array, starting with [ and ending with ]`

  const message = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  })

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : ""

  // Extract JSON array from response
  const start = raw.indexOf("[")
  const end = raw.lastIndexOf("]")
  if (start === -1 || end === -1) {
    return NextResponse.json({ error: "AI returned invalid format" }, { status: 500 })
  }

  let questions: unknown[]
  try {
    questions = JSON.parse(raw.slice(start, end + 1))
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
  }

  // Validate and sanitize
  const valid = questions
    .filter((q: any) => q.text && q.type && q.answer)
    .map((q: any) => ({
      text: String(q.text),
      type: q.type === "SHORT_ANSWER" ? "SHORT_ANSWER" : "MULTIPLE_CHOICE",
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      answer: String(q.answer),
      points: Math.min(Math.max(Number(q.points) || 1, 1), 5),
    }))

  return NextResponse.json({ questions: valid, count: valid.length })
}
