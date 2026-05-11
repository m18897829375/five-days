"use client"

import { useRouter } from "next/navigation"
import ProgressBar from "@/components/ProgressBar"
import StepPage from "@/components/StepPage"

export default function GoalsPage() {
  const router = useRouter()

  return (
    <StepPage
      title="选择你的目标"
      onContinue={() => router.push("/quiz/exercise")}
    >
      <ProgressBar
        currentStep="GOALS"
        completedSteps={["AGE_RANGE", "GENDER", "BODY_DATA"]}
      />
      <p className="text-center text-gray-500">目标多选卡片（US-012 实现）</p>
    </StepPage>
  )
}
