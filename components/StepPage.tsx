"use client"

import ProgressBar from "./ProgressBar"

interface StepPageProps {
  title: string
  currentStep: string
  children: React.ReactNode
  onContinue?: () => void
  buttonText?: string
  loading?: boolean
}

export default function StepPage({
  title,
  currentStep,
  children,
  onContinue,
  buttonText = "继续",
  loading = false,
}: StepPageProps) {
  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <ProgressBar currentStep={currentStep} />
      <h1 className="text-2xl font-bold mt-8 mb-6">{title}</h1>
      <div className="mb-8">{children}</div>
      {onContinue && (
        <button
          onClick={onContinue}
          disabled={loading}
          className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "提交中..." : buttonText}
        </button>
      )}
    </main>
  )
}
