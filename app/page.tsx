"use client"

import { useRouter } from "next/navigation"
import ProgressBar from "@/components/ProgressBar"
import StepPage from "@/components/StepPage"

export default function HomePage() {
  const router = useRouter()

  return (
    <StepPage
      title="选择你的年龄段"
      onContinue={() => router.push("/quiz/gender")}
    >
      <ProgressBar currentStep="AGE_RANGE" completedSteps={[]} />
      <p className="text-center text-gray-500">年龄选择卡片（US-011 实现）</p>
    </StepPage>
  )
}
