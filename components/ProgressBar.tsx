"use client"

const STEPS = ["年龄", "性别", "身体", "目标", "运动"]

interface ProgressBarProps {
  currentStepIndex: number
  completedStepCount: number
}

export default function ProgressBar({ currentStepIndex, completedStepCount }: ProgressBarProps) {
  const completedWidth =
    STEPS.length > 1 ? `${(completedStepCount / (STEPS.length - 1)) * 100}%` : "0%"

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-10" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-blue-600 -z-10 transition-all duration-500"
          style={{ width: `calc(${completedWidth} - 2rem)` }}
        />

        {STEPS.map((label, index) => {
          const isCompleted = index < completedStepCount
          const isCurrent = index === currentStepIndex

          return (
            <div key={label} className="flex flex-col items-center gap-2 z-10">
              <div
                className={
                  isCompleted
                    ? "w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold"
                    : isCurrent
                      ? "w-8 h-8 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center text-blue-600 text-sm font-bold ring-4 ring-blue-100"
                      : "w-8 h-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-400 text-sm"
                }
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={
                  isCompleted
                    ? "text-xs text-blue-600 font-medium"
                    : isCurrent
                      ? "text-xs text-blue-600 font-semibold"
                      : "text-xs text-gray-400"
                }
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
