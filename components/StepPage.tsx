"use client"

import ProgressBar from "./ProgressBar"

interface StepPageProps {
  title: string
  currentStepIndex: number
  completedStepCount: number
  continueButton?: {
    label: string
    onClick: () => void
    disabled?: boolean
  }
  children: React.ReactNode
}

export default function StepPage({
  title,
  currentStepIndex,
  completedStepCount,
  continueButton,
  children,
}: StepPageProps) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <ProgressBar
        currentStepIndex={currentStepIndex}
        completedStepCount={completedStepCount}
      />
      <h1 className="text-2xl font-bold text-center mt-6 mb-8">{title}</h1>
      <div className="mb-8">{children}</div>
      {continueButton && (
        <div className="flex justify-center">
          <button
            onClick={continueButton.onClick}
            disabled={continueButton.disabled}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {continueButton.label}
          </button>
        </div>
      )}
    </div>
  )
}
