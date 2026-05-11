"use client"

import { useRouter } from "next/navigation"
import ProgressBar from "@/components/ProgressBar"
import StepPage from "@/components/StepPage"

export default function BodyPage() {
  const router = useRouter()

  return (
    <StepPage
      title="输入你的身体数据"
      onContinue={() => router.push("/quiz/goals")}
    >
      <ProgressBar
        currentStep="BODY_DATA"
        completedSteps={["AGE_RANGE", "GENDER"]}
      />
      <p className="text-center text-gray-500">身体数据输入表单（US-012 实现）</p>
    </StepPage>
  )
}
