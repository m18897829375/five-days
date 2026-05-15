import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateAll } from "@/lib/health"

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ success: false, error: "Not Found" }, { status: 404 })
  }

  const sessionId = crypto.randomUUID()

  const user = await prisma.user.create({
    data: { sessionId, subscription: "PREMIUM" },
  })

  const steps = [
    { step: "AGE_RANGE" as const, data: { ageRange: "18-29" } },
    { step: "GENDER" as const, data: { gender: "male" } },
    { step: "BODY_DATA" as const, data: { age: 25, height: 175, currentWeight: 80, targetWeight: 72 } },
    { step: "GOALS" as const, data: { goals: ["lose_weight", "tone_muscle"] } },
    { step: "EXERCISE_FREQUENCY" as const, data: { frequency: "moderate" } },
  ]

  for (const s of steps) {
    await prisma.quizStep.create({
      data: { userId: user.id, step: s.step, data: s.data },
    })
  }

  const result = calculateAll({
    currentWeight: 80,
    targetWeight: 72,
    heightCm: 175,
    age: 25,
    gender: "male",
    goals: ["lose_weight", "tone_muscle"],
    frequency: "moderate",
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

  const host = request.headers.get("host") || "localhost:3000"
  const protocol = request.headers.get("x-forwarded-proto") || "http"
  const baseUrl = `${protocol}://${host}`

  return NextResponse.json({
    success: true,
    data: {
      sessionId,
      subscription: "PREMIUM",
      curlExample: `curl -H "Cookie: sessionId=${sessionId}" ${baseUrl}/api/results`,
    },
  })
}
