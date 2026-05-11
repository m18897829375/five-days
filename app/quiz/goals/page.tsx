"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ProgressBar from "@/components/ProgressBar"
import StepPage from "@/components/StepPage"
import { STEP_ROUTE_MAP } from "@/lib/step-routes"

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ")
}

const GOAL_OPTIONS = [
  { value: "lose_weight", label: "减重", emoji: "🔥" },
  { value: "tone_muscle", label: "塑形", emoji: "💪" },
  { value: "build_muscle", label: "增肌", emoji: "🏋️" },
  { value: "stay_healthy", label: "保持健康", emoji: "❤️" },
]

export default function GoalsPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  function toggle(value: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }

  async function handleContinue() {
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch("/api/quiz/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "GOALS", data: { goals: Array.from(selected) } }),
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
      title="选择你的目标"
      onContinue={handleContinue}
      continueLabel={submitting ? "提交中..." : "继续"}
      continueDisabled={selected.size === 0 || submitting}
    >
      <ProgressBar
        currentStep="GOALS"
        completedSteps={["AGE_RANGE", "GENDER", "BODY_DATA"]}
      />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {GOAL_OPTIONS.map((opt) => {
          const isSelected = selected.has(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              disabled={submitting}
              aria-label={`选择${opt.label}目标`}
              aria-pressed={isSelected}
              className={cn(
                "relative rounded-2xl border-2 p-6 text-center transition-all",
                isSelected
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                submitting && "cursor-not-allowed opacity-60"
              )}
            >
              {isSelected && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                  ✓
                </span>
              )}
              <span className="block text-4xl">{opt.emoji}</span>
              <span className="mt-2 block text-base font-medium text-gray-900">
                {opt.label}
              </span>
              <span className="mt-0.5 block text-xs text-gray-400">
                {opt.value}
              </span>
            </button>
          )
        })}
      </div>

      {selected.size === 0 && !submitting && (
        <p className="mt-4 text-center text-sm text-gray-400">
          请至少选择一个目标
        </p>
      )}
    </StepPage>
  )
}
