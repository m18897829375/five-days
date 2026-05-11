"use client"

import { useRouter } from "next/navigation"
import ProgressBar from "@/components/ProgressBar"
import StepPage from "@/components/StepPage"

export default function ExercisePage() {
  const router = useRouter()

  return (
    <StepPage
      title="选择你的运动频率"
      onContinue={() => router.push("/results")}
    >
      <ProgressBar
        currentStep="EXERCISE_FREQUENCY"
        completedSteps={["AGE_RANGE", "GENDER", "BODY_DATA", "GOALS"]}
      />
      <p className="text-center text-gray-500">运动频率选择（US-012 实现）</p>
    </StepPage>
  )
}
