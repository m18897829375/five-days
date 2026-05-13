import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("sessionId")?.value

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "未找到会话" } },
      { status: 404 },
    )
  }

  const user = await prisma.user.findUnique({ where: { sessionId } })
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "无效会话" } },
      { status: 404 },
    )
  }

  const healthResult = await prisma.healthResult.findUnique({
    where: { userId: user.id },
  })

  if (!healthResult) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "请先完成测评" } },
      { status: 404 },
    )
  }

  const bodyDataStep = await prisma.quizStep.findUnique({
    where: { userId_step: { userId: user.id, step: "BODY_DATA" } },
  })
  const bodyData = (bodyDataStep?.data as Record<string, unknown>) ?? {}
  const currentWeight = (bodyData.currentWeight as number) ?? 0
  const targetWeight = (bodyData.targetWeight as number) ?? 0

  const isPremium = user.subscription === "PREMIUM"

  const result = {
    bmi: healthResult.bmi,
    bmiCategory: healthResult.bmiCategory,
    bmr: healthResult.bmr,
    tdee: healthResult.tdee,
    recommendedCalories: healthResult.recommendedCalories,
    targetDate: healthResult.targetDate.toISOString(),
    currentWeight,
    targetWeight,
    weeklyProjection: isPremium ? healthResult.weeklyProjection : null,
    planDetails: isPremium ? healthResult.planDetails : null,
    ...(isPremium ? {} : { lockMessage: "升级至PREMIUM解锁完整报告" }),
  }

  return NextResponse.json(
    { success: true, result, subscription: user.subscription },
    { status: 200 },
  )
}
