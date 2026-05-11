"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ProgressBar from "@/components/ProgressBar"
import StepPage from "@/components/StepPage"
import { STEP_ROUTE_MAP } from "@/lib/step-routes"

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ")
}

const EXERCISE_OPTIONS = [
  { value: "sedentary", label: "久坐", description: "几乎不运动，每周少于 1 次" },
  { value: "light", label: "轻度", description: "每周运动 1-2 次，低强度活动" },
  { value: "moderate", label: "中度", description: "每周运动 3-4 次，中等强度" },
  { value: "active", label: "活跃", description: "每周运动 5-6 次，较高强度" },
  { value: "very_active", label: "非常活跃", description: "每周运动 6 次以上，高强度训练" },
]

export default function ExercisePage() {
  const router = useRouter()
  const [selected, setSelected] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleContinue() {
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch("/api/quiz/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "EXERCISE_FREQUENCY", data: { frequency: selected } }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error?.message ?? "网络错误，请重试")
        return
      }
      const nextRoute = data.nextStep ? STEP_ROUTE_MAP[data.nextStep] : "/results"
      if (nextRoute) router.push(nextRoute)
    } catch {
      setError("网络错误，请重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <StepPage
      title="选择你的运动频率"
      onContinue={handleContinue}
      continueLabel={submitting ? "提交中..." : "继续"}
      continueDisabled={!selected || submitting}
    >
      <ProgressBar
        currentStep="EXERCISE_FREQUENCY"
        completedSteps={["AGE_RANGE", "GENDER", "BODY_DATA", "GOALS"]}
      />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {EXERCISE_OPTIONS.map((opt) => {
          const isSelected = selected === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              disabled={submitting}
              aria-label={`选择${opt.label}`}
              aria-pressed={isSelected}
              className={cn(
                "relative rounded-2xl border-2 p-5 text-left transition-all",
                isSelected
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                submitting && "cursor-not-allowed opacity-60"
              )}
            >
              {isSelected && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                  ✓
                </span>
              )}
              <span className="block text-lg font-semibold text-gray-900">
                {opt.label}
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                {opt.description}
              </span>
            </button>
          )
        })}
      </div>

      {!selected && !submitting && (
        <p className="mt-4 text-center text-sm text-gray-400">
          请选择你的运动频率
        </p>
      )}
    </StepPage>
  )
}
