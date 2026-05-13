import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

  const healthResult = await prisma.healthResult.findUnique({
    where: { userId: user.id },
  })

  if (!healthResult) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "请先完成测评" } },
      { status: 404 },
    )
  }

  // Fetch BODY_DATA quiz step for currentWeight/targetWeight
  const bodyStep = await prisma.quizStep.findUnique({
    where: { userId_step: { userId: user.id, step: "BODY_DATA" } },
  })

  const bodyData = bodyStep?.data as Record<string, unknown> | null
  const currentWeight = (bodyData?.currentWeight as number) ?? 0
  const targetWeight = (bodyData?.targetWeight as number) ?? 0

  const base = {
    bmi: healthResult.bmi,
    bmiCategory: healthResult.bmiCategory,
    bmr: healthResult.bmr,
    recommendedCalories: healthResult.recommendedCalories,
    targetDate: healthResult.targetDate.toISOString(),
    currentWeight,
    targetWeight,
    subscription: user.subscription,
  }

  if (user.subscription === "PREMIUM") {
    return NextResponse.json({
      success: true,
      data: {
        ...base,
        weeklyProjection: healthResult.weeklyProjection,
        planDetails: healthResult.planDetails,
      },
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      ...base,
      weeklyProjection: null,
      planDetails: null,
      lockMessage: "解锁完整报告查看详细数据",
    },
  })
}
