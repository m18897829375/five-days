"use client"

import StepPage from "@/components/StepPage"

export default function HomePage() {
  return (
    <StepPage title="选择您的年龄段" currentStep="AGE_RANGE">
      <p className="text-gray-500 text-center">年龄选择卡片将在下一步实现</p>
    </StepPage>
  )
}
