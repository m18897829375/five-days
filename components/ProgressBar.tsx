"use client"

const STEP_LABELS: Record<string, string> = {
  AGE_RANGE: "年龄",
  GENDER: "性别",
  BODY_DATA: "身体",
  GOALS: "目标",
  EXERCISE_FREQUENCY: "运动",
}

const STEP_ORDER = ["AGE_RANGE", "GENDER", "BODY_DATA", "GOALS", "EXERCISE_FREQUENCY"]

interface ProgressBarProps {
  currentStep: string
  completedSteps: string[]
}

export default function ProgressBar({ currentStep, completedSteps }: ProgressBarProps) {
  return (
    <div className="mb-6 flex items-center justify-between gap-1">
      {STEP_ORDER.map((step, i) => {
        const isCompleted = completedSteps.includes(step)
        const isCurrent = step === currentStep
        const label = STEP_LABELS[step] ?? step

        return (
          <div key={step} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div
                  className={`h-0.5 flex-1 ${
                    isCompleted || (completedSteps.includes(STEP_ORDER[i - 1]) && isCurrent)
                      ? "bg-blue-500"
                      : "bg-gray-200"
                  }`}
                />
              )}
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  isCompleted
                    ? "bg-blue-500 text-white"
                    : isCurrent
                      ? "border-2 border-blue-500 bg-white text-blue-500"
                      : "border-2 border-gray-200 bg-white text-gray-300"
                }`}
                aria-label={`${label}${isCompleted ? " 已完成" : isCurrent ? " 当前" : " 未开始"}`}
              >
                {isCompleted ? "✓" : i + 1}
              </div>
              {i < STEP_ORDER.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    isCompleted ? "bg-blue-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <span
              className={`text-xs font-medium ${
                isCompleted
                  ? "text-blue-500"
                  : isCurrent
                    ? "text-blue-600"
                    : "text-gray-300"
              }`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
