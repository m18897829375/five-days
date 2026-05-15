"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import StepPage from "@/components/StepPage"
import { STEP_ROUTE_MAP } from "@/lib/step-routes"
import { cn } from "@/lib/utils"

const GOAL_OPTIONS = [
  { value: "lose_weight" as const, icon: "⚖️", label: "减重", gradient: "orange", ariaLabel: "选择减重目标" },
  { value: "tone_muscle" as const, icon: "💪", label: "塑形", gradient: "purple", ariaLabel: "选择塑形目标" },
  { value: "build_muscle" as const, icon: "🏋️", label: "增肌", gradient: "red", ariaLabel: "选择增肌目标" },
  { value: "stay_healthy" as const, icon: "❤️", label: "保持健康", gradient: "green", ariaLabel: "选择保持健康目标" },
]

const GRADIENT_CLASSES: Record<string, string> = {
  orange: "bg-gradient-to-br from-orange-500 to-orange-700",
  purple: "bg-gradient-to-br from-purple-500 to-purple-700",
  red: "bg-gradient-to-br from-red-500 to-red-700",
  green: "bg-gradient-to-br from-green-500 to-green-700",
}

export default function GoalsPage() {
  const router = useRouter()
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleGoal(value: string) {
    setSelectedGoals((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
    setError(null)
  }

  async function handleContinue() {
    if (selectedGoals.size === 0) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/quiz/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "GOALS", data: { goals: Array.from(selectedGoals) } }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error?.message || "服务器内部错误")
        setSubmitting(false)
        return
      }

      const route = STEP_ROUTE_MAP[data.data.nextStep]
      if (route) {
        router.push(route)
      }
    } catch {
      setError("网络请求失败，请检查网络连接后重试")
      setSubmitting(false)
    }
  }

  const isEmpty = selectedGoals.size === 0

  return (
    <StepPage title="选择您的健身目标" currentStep="GOALS">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {GOAL_OPTIONS.map((option) => {
          const isSelected = selectedGoals.has(option.value)
          return (
            <button
              key={option.value}
              onClick={() => toggleGoal(option.value)}
              disabled={submitting}
              aria-label={option.ariaLabel}
              aria-pressed={isSelected}
              className={cn(
                "relative flex flex-col items-center justify-center p-6 rounded-xl text-white font-bold text-lg transition-all duration-200",
                GRADIENT_CLASSES[option.gradient],
                !submitting && "hover:scale-105",
                isSelected && "ring-4 ring-blue-500 ring-offset-2 ring-offset-white",
                submitting && !isSelected && "opacity-50",
                submitting && "cursor-not-allowed",
              )}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">
                  ✓
                </span>
              )}
              <span className="text-4xl mb-2">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleContinue}
        disabled={isEmpty || submitting}
        className={cn(
          "mt-6 w-full py-3 px-6 rounded-lg font-medium transition-colors",
          isEmpty
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700",
          submitting && "opacity-50 cursor-not-allowed",
        )}
      >
        {submitting ? "提交中..." : "继续"}
      </button>
    </StepPage>
  )
}
