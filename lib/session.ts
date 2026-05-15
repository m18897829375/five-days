import { prisma } from "@/lib/prisma"

const VALID_STEPS = [
  "AGE_RANGE",
  "GENDER",
  "BODY_DATA",
  "GOALS",
  "EXERCISE_FREQUENCY",
] as const

type StepEnum = (typeof VALID_STEPS)[number]

export async function createSession() {
  const sessionId = crypto.randomUUID()
  const user = await prisma.user.create({
    data: { sessionId, subscription: "FREE" },
  })
  return { sessionId: user.sessionId, subscription: user.subscription }
}

export async function getProgress(sessionId: string) {
  const user = await prisma.user.findUnique({ where: { sessionId } })
  if (!user) return null

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

  return { currentStep, completedSteps, data, isCompleted }
}
