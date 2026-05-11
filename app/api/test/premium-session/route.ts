import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateAll } from "@/lib/health"

const TEST_DATA = {
  age: 30,
  height: 175,
  currentWeight: 80,
  targetWeight: 70,
  gender: "male",
  goals: ["lose_weight"],
  frequency: "moderate",
}

export async function GET() {
  const sessionId = crypto.randomUUID()

  const user = await prisma.user.create({
    data: { sessionId, subscription: "PREMIUM" },
  })

  const steps = [
    { step: "AGE_RANGE" as const, data: { ageRange: "30-39" } },
    { step: "GENDER" as const, data: { gender: TEST_DATA.gender } },
    { step: "BODY_DATA" as const, data: { age: TEST_DATA.age, height: TEST_DATA.height, currentWeight: TEST_DATA.currentWeight, targetWeight: TEST_DATA.targetWeight } },
    { step: "GOALS" as const, data: { goals: TEST_DATA.goals } },
    { step: "EXERCISE_FREQUENCY" as const, data: { frequency: TEST_DATA.frequency } },
  ]

  for (const s of steps) {
    await prisma.quizStep.create({
      data: { userId: user.id, step: s.step, data: s.data as Prisma.InputJsonValue },
    })
  }

  const result = calculateAll({
    currentWeight: TEST_DATA.currentWeight,
    targetWeight: TEST_DATA.targetWeight,
    heightCm: TEST_DATA.height,
    age: TEST_DATA.age,
    gender: TEST_DATA.gender,
    goals: TEST_DATA.goals,
    frequency: TEST_DATA.frequency,
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

  return NextResponse.json({
    sessionId,
    subscription: "PREMIUM",
    curlExample: `curl -s -b 'sessionId=${sessionId}' http://localhost:3000/api/results | jq .`,
  })
}
