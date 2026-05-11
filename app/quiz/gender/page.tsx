"use client"

import { useRouter } from "next/navigation"
import ProgressBar from "@/components/ProgressBar"
import StepPage from "@/components/StepPage"

export default function GenderPage() {
  const router = useRouter()

  return (
    <StepPage
      title="选择你的性别"
      onContinue={() => router.push("/quiz/body")}
    >
      <ProgressBar currentStep="GENDER" completedSteps={["AGE_RANGE"]} />
      <p className="text-center text-gray-500">性别选择控件（US-011 实现）</p>
    </StepPage>
  )
}
