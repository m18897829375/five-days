import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const VALID_STEPS = [
  "AGE_RANGE",
  "GENDER",
  "BODY_DATA",
  "GOALS",
  "EXERCISE_FREQUENCY",
] as const

type StepEnum = (typeof VALID_STEPS)[number]

export async function GET() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("sessionId")?.value

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "未找到会话" } },
      { status: 401 },
    )
  }

  const user = await prisma.user.findUnique({ where: { sessionId } })
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "无效会话" } },
      { status: 401 },
    )
  }

  const quizSteps = await prisma.quizStep.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  })

  const completedSteps = quizSteps.map((s) => s.step)
  const isCompleted = completedSteps.length === VALID_STEPS.length

  let currentStep: StepEnum | null = null
  if (!isCompleted) {
    for (const step of VALID_STEPS) {
      if (!completedSteps.includes(step)) {
        currentStep = step
        break
      }
    }
  }

  const data: Record<string, unknown> = {}
  for (const step of quizSteps) {
    Object.assign(data, step.data as Record<string, unknown>)
  }

  return NextResponse.json({
    success: true,
    data: {
      currentStep,
      completedSteps,
      data,
      isCompleted,
    },
  })
}
