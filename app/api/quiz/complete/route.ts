import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { QuizStep } from "@prisma/client"
import { calculateAll } from "@/lib/health"
import { bodyDataSchema } from "@/lib/schemas"

const VALID_STEPS = [
  "AGE_RANGE",
  "GENDER",
  "BODY_DATA",
  "GOALS",
  "EXERCISE_FREQUENCY",
] as const

export async function POST() {
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

  const completedSteps = quizSteps.map((s: QuizStep) => s.step)
  const missingSteps = VALID_STEPS.filter((s) => !completedSteps.includes(s))

  if (missingSteps.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INCOMPLETE_QUIZ",
          message: `未完成全部测评步骤，还差 ${missingSteps.length} 步`,
          details: { missingSteps },
        },
      },
      { status: 400 },
    )
  }

  const existing = await prisma.healthResult.findUnique({
    where: { userId: user.id },
  })
  if (existing) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "ALREADY_COMPLETED", message: "已完成测评，不可重复提交" },
      },
      { status: 409 },
    )
  }

  const data: Record<string, unknown> = {}
  for (const step of quizSteps) {
    Object.assign(data, step.data as Record<string, unknown>)
  }

  const parsed = bodyDataSchema.safeParse(data)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_BODY_DATA", message: "身体数据校验失败" } },
      { status: 400 },
    )
  }

  const age = parsed.data.age
  const height = parsed.data.height
  const currentWeight = parsed.data.currentWeight
  const targetWeight = parsed.data.targetWeight
  const gender = data.gender as string
  const goals = data.goals as string[]
  const frequency = data.frequency as string

  const result = calculateAll({
    currentWeight,
    targetWeight,
    heightCm: height,
    age,
    gender,
    goals,
    frequency,
  })

  await prisma.healthResult.create({
    data: {
      userId: user.id,
      bmi: result.bmi,
      bmiCategory: result.bmiCategory,
      bmr: result.bmr,
      tdee: result.tdee,
      recommendedCalories: result.recommendedCalories,
      targetDate: new Date(result.targetDate),
      weeklyProjection: result.weeklyProjection,
      planDetails: result.planDetails,
    },
  })

  return NextResponse.json({ success: true, data: { result } }, { status: 200 })
}
