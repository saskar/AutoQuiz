import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as https from "node:https"

// Calls the Anthropic Messages API using node:https directly.
// This bypasses Next.js's patched global fetch (which re-stringifies Buffer
// bodies and triggers undici's Latin-1 ByteString check on non-ASCII content).
function callAnthropic(payload: {
  model: string
  max_tokens: number
  system: string
  messages: Array<{ role: string; content: string }>
}): Promise<{ content: Array<{ type: string; text: string }> }> {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY ?? ""
    const body = Buffer.from(JSON.stringify(payload), "utf-8")

    const req = https.request(
      {
        hostname: "api.anthropic.com",
        port: 443,
        path: "/v1/messages",
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "content-length": body.length,
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on("data", (c: Buffer) => chunks.push(c))
        res.on("end", () => {
          try {
            const text = Buffer.concat(chunks).toString("utf-8")
            const json = JSON.parse(text)
            const status = res.statusCode ?? 0
            if (status >= 200 && status < 300) {
              resolve(json)
            } else {
              const msg = json?.error?.message ?? `HTTP ${status}`
              reject(Object.assign(new Error(msg), { status }))
            }
          } catch (e) {
            reject(e)
          }
        })
        res.on("error", reject)
      }
    )
    req.on("error", reject)
    req.write(body)
    req.end()
  })
}

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

const READING_COMP_KEYWORDS = [
  "reading comprehension", "reading comp", "فهم القرائي", "فهم قرائي",
  "arabic reading", "english reading", "reading passage", "comprehension",
]

function isReadingComprehension(topic: string): boolean {
  const lower = topic.toLowerCase()
  return READING_COMP_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set in .env" }, { status: 500 })
  }

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
  const readingComp = isReadingComprehension(topic)

  const typeInstruction =
    questionTypes === "SHORT_ANSWER"
      ? "Use SHORT_ANSWER type only. Set options to empty array []."
      : questionTypes === "MULTIPLE_CHOICE"
      ? "Use MULTIPLE_CHOICE type only with exactly 4 options."
      : "Use a natural mix: roughly 70% MULTIPLE_CHOICE and 30% SHORT_ANSWER."

  const difficultyHint =
    difficulty === "beginner" || difficulty === "easy"
      ? "Use straightforward recall and comprehension questions."
      : difficulty === "hard" || difficulty === "advanced" || difficulty === "expert"
      ? "Use advanced analysis, synthesis, and critical thinking questions."
      : "Balance recall with application and analysis questions."

  const systemPrompt =
    "You are an expert educator and exam writer. You create clear, well-structured exam questions following best practices. You always respond with valid JSON only - no markdown fences, no extra text."

  let userPrompt: string

  if (readingComp) {
    const isArabic =
      topic.toLowerCase().includes("arabic") ||
      topic.includes("عربي") ||
      topic.includes("قرائي")
    userPrompt = `Create a reading comprehension ${examLabel} about "${topic}" for ${gradeLevel} students at ${difficulty} level.

${isArabic ? "Write the passage in Arabic. Write questions in Arabic." : "Write the passage in English."}

You must return a JSON object (NOT an array) with exactly this structure:
{
  "passage": "A well-written passage of at least 3 paragraphs (minimum 300 words). Each paragraph should be separated by \\n\\n. The passage must be rich, engaging, and appropriate for the level.",
  "questions": [
    {
      "text": "Question about the passage",
      "type": "MULTIPLE_CHOICE",
      "options": ["A", "B", "C", "D"],
      "answer": "exact matching option",
      "points": 1
    }
  ]
}

Generate exactly ${count} questions based solely on the passage.
${typeInstruction}
${difficultyHint}

STRICT RULES:
- The passage MUST be at least 3 full paragraphs separated by \\n\\n - never skip this
- Every question must be answerable directly from the passage text
- Multiple choice: exactly 4 options, answer must exactly match one option string
- Short answer: options must be []
- Return only the JSON object, no extra text, no markdown`
  } else {
    userPrompt = `Create ${count} ${difficulty} questions for a ${examLabel} about: "${topic}"${subject ? ` (subject: ${subject})` : ""}
Target audience: ${gradeLevel}

${typeInstruction}
${difficultyHint}

Return a JSON array only. Each item must follow this schema exactly:
{
  "text": "Full question text",
  "type": "MULTIPLE_CHOICE or SHORT_ANSWER",
  "options": ["A", "B", "C", "D"],
  "answer": "exact correct answer",
  "points": 1
}

Important rules:
- Multiple choice: exactly 4 distinct options, answer must exactly match one option string
- Short answer: concise expected answer, options must be []
- All questions must be factually accurate and unambiguous
- Vary question styles (define, explain, calculate, compare, identify, etc.)
- Return only the JSON array, starting with [ and ending with ]`
  }

  let message: { content: Array<{ type: string; text: string }> }
  try {
    message = await callAnthropic({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    })
  } catch (err: any) {
    const msg: string = err?.message ?? String(err)
    const status: number = err?.status ?? 500
    if (status === 401 || msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("auth")) {
      return NextResponse.json({ error: "Invalid Anthropic API key. Check ANTHROPIC_API_KEY in your .env file." }, { status: 401 })
    }
    if (status === 429 || msg.toLowerCase().includes("credit") || msg.toLowerCase().includes("balance") || msg.toLowerCase().includes("quota")) {
      return NextResponse.json({ error: "AI credits exhausted. Add credits at console.anthropic.com" }, { status: 429 })
    }
    return NextResponse.json({ error: `AI request failed: ${msg}` }, { status: 500 })
  }

  const raw = message.content[0]?.type === "text" ? message.content[0].text.trim() : ""

  if (readingComp) {
    const start = raw.indexOf("{")
    const end = raw.lastIndexOf("}")
    if (start === -1 || end === -1) {
      return NextResponse.json({ error: "AI returned invalid format" }, { status: 500 })
    }
    let parsed: { passage?: string; questions?: unknown[] }
    try {
      parsed = JSON.parse(raw.slice(start, end + 1))
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    const passage = typeof parsed.passage === "string" ? parsed.passage.trim() : ""
    const questions = Array.isArray(parsed.questions) ? parsed.questions : []

    const valid = questions
      .filter((q: any) => q.text && q.type && q.answer)
      .map((q: any) => ({
        text: String(q.text),
        type: q.type === "SHORT_ANSWER" ? "SHORT_ANSWER" : "MULTIPLE_CHOICE",
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        answer: String(q.answer),
        points: Math.min(Math.max(Number(q.points) || 1, 1), 5),
      }))

    return NextResponse.json({ passage, questions: valid, count: valid.length })
  } else {
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
}
