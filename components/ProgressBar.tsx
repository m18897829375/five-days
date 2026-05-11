"use client"

const STEPS = [
  { key: "AGE_RANGE", label: "年龄范围" },
  { key: "GENDER", label: "性别" },
  { key: "BODY_DATA", label: "身体数据" },
  { key: "GOALS", label: "目标" },
  { key: "EXERCISE_FREQUENCY", label: "运动频率" },
] as const

interface ProgressBarProps {
  currentStep: string
  completedSteps: string[]
}

export default function ProgressBar({ currentStep, completedSteps }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 px-4 py-6">
      {STEPS.map((step, i) => {
        const isCompleted = completedSteps.includes(step.key)
        const isCurrent = step.key === currentStep

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-200"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1 whitespace-nowrap text-xs ${
                  isCurrent ? "font-semibold text-blue-700" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 mb-5 h-0.5 w-6 sm:w-10 ${
                  completedSteps.includes(STEPS[i + 1].key) ||
                  (isCompleted && step.key === currentStep)
                    ? "bg-green-500"
                    : "bg-gray-200"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
