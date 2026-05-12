"use client"

import StepPage from "@/components/StepPage"

export default function HomePage() {
  return (
    <StepPage
      title="健康测评"
      currentStepIndex={0}
      completedStepCount={0}
    >
      <p className="text-center text-gray-500">
        欢迎使用健康测评系统，请按步骤完成问卷。
      </p>
    </StepPage>
  )
}
