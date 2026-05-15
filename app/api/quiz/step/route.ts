import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  ageRangeSchema,
  genderSchema,
  bodyDataSchema,
  goalsSchema,
  exerciseSchema,
} from "@/lib/schemas"
import type { z } from "zod"
import type { Prisma } from "@prisma/client"

const VALID_STEPS = [
  "AGE_RANGE",
  "GENDER",
  "BODY_DATA",
  "GOALS",
  "EXERCISE_FREQUENCY",
] as const

type StepEnum = (typeof VALID_STEPS)[number]

const STEP_NEXT: Record<StepEnum, string | null> = {
  AGE_RANGE: "GENDER",
  GENDER: "BODY_DATA",
  BODY_DATA: "GOALS",
  GOALS: "EXERCISE_FREQUENCY",
  EXERCISE_FREQUENCY: null,
}

const STEP_SCHEMAS: Record<StepEnum, z.ZodTypeAny> = {
  AGE_RANGE: ageRangeSchema,
  GENDER: genderSchema,
  BODY_DATA: bodyDataSchema,
  GOALS: goalsSchema,
  EXERCISE_FREQUENCY: exerciseSchema,
}

function formatZodError(error: z.ZodError) {
  const issue = error.issues[0]
  const field = issue.path.join(".")
  return {
    code: "VALIDATION_ERROR" as const,
    message: issue.message,
    field: field || undefined,
    received: (issue as unknown as { received?: unknown }).received,
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("sessionId")?.value

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "未找到会话，请先访问首页" } },
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "请求体必须为 JSON" } },
      { status: 400 },
    )
  }

  const parsed = body as { step?: unknown; data?: unknown }

  if (typeof parsed.step !== "string" || !VALID_STEPS.includes(parsed.step as StepEnum)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `无效的步骤: ${String(parsed.step)}，有效值: ${VALID_STEPS.join(", ")}`,
          field: "step",
          received: parsed.step,
        },
      },
      { status: 400 },
    )
  }

  const step = parsed.step as StepEnum
  const schema = STEP_SCHEMAS[step]
  const result = schema.safeParse(parsed.data)

  if (!result.success) {
    const zodErr = formatZodError(result.error)
    return NextResponse.json(
      { success: false, error: zodErr },
      { status: 400 },
    )
  }

  await prisma.quizStep.upsert({
    where: { userId_step: { userId: user.id, step } },
    create: {
      userId: user.id,
      step,
      data: result.data as Prisma.InputJsonValue,
    },
    update: { data: result.data as Prisma.InputJsonValue },
  })

  await prisma.healthResult.deleteMany({ where: { userId: user.id } })

  return NextResponse.json(
    { success: true, data: { nextStep: STEP_NEXT[step] } },
    { status: 200 },
  )
}
