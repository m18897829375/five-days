"use client"

import { QUIZ_STEPS } from "@/lib/quiz-steps"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  currentStep: string
}

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  const currentIndex = QUIZ_STEPS.findIndex((s) => s.step === currentStep)

  return (
    <div className="flex items-center justify-between w-full" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={5} aria-label={`步骤 ${currentIndex + 1}/5`}>
      {QUIZ_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div key={step.step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "ring-2 ring-blue-600 text-blue-600 bg-white",
                  !isCompleted && !isCurrent && "bg-gray-200 text-gray-400"
                )}
              >
                {isCompleted ? "✓" : index + 1}
              </div>
              <span
                className={cn(
                  "mt-1 text-xs whitespace-nowrap",
                  isCompleted && "text-green-600",
                  isCurrent && "text-blue-600 font-medium",
                  !isCompleted && !isCurrent && "text-gray-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < QUIZ_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-1 mt-[-16px]",
                  index < currentIndex ? "bg-green-500" : "bg-gray-200"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
