"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import StepPage from "@/components/StepPage"
import { STEP_ROUTE_MAP } from "@/lib/step-routes"
import { cn } from "@/lib/utils"
import { GRADIENT_CLASSES } from "@/lib/styles"

const EXERCISE_OPTIONS = [
  {
    value: "sedentary" as const,
    icon: "🪑",
    label: "久坐",
    description: "几乎不运动，每周少于 1 次",
    gradient: "slate",
    ariaLabel: "选择久坐 — 几乎不运动，每周少于 1 次",
  },
  {
    value: "light" as const,
    icon: "🚶",
    label: "轻度",
    description: "每周运动 1-2 次，轻度活动",
    gradient: "teal",
    ariaLabel: "选择轻度 — 每周运动 1-2 次，轻度活动",
  },
  {
    value: "moderate" as const,
    icon: "🏃",
    label: "中度",
    description: "每周运动 3-4 次，中等强度",
    gradient: "blueStatic",
    ariaLabel: "选择中度 — 每周运动 3-4 次，中等强度",
  },
  {
    value: "active" as const,
    icon: "🚴",
    label: "活跃",
    description: "每周运动 5-6 次，高强度训练",
    gradient: "orangeStatic",
    ariaLabel: "选择活跃 — 每周运动 5-6 次，高强度训练",
  },
  {
    value: "very_active" as const,
    icon: "🏆",
    label: "非常活跃",
    description: "每天运动，专业运动员级别",
    gradient: "red",
    ariaLabel: "选择非常活跃 — 每天运动，专业运动员级别",
  },
]

export default function ExercisePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleContinue() {
    if (!selected) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/quiz/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "EXERCISE_FREQUENCY", data: { frequency: selected } }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error?.message || "服务器内部错误")
        setSubmitting(false)
        return
      }

      const route = data.data.nextStep ? STEP_ROUTE_MAP[data.data.nextStep] : null
      if (route) {
        router.push(route)
      } else {
        const completeRes = await fetch("/api/quiz/complete", { method: "POST" })
        const completeData = await completeRes.json()
        if (!completeRes.ok || !completeData.success) {
          setError(completeData.error?.message || "提交失败，请重试")
          setSubmitting(false)
          return
        }
        router.push("/results")
      }
    } catch {
      setError("网络请求失败，请检查网络连接后重试")
      setSubmitting(false)
    }
  }

  const isEmpty = selected === null

  return (
    <StepPage title="选择您的运动频率" currentStep="EXERCISE_FREQUENCY">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {EXERCISE_OPTIONS.map((option) => {
          const isSelected = selected === option.value
          return (
            <button
              key={option.value}
              onClick={() => {
                setSelected(option.value)
                setError(null)
              }}
              disabled={submitting}
              aria-label={option.ariaLabel}
              aria-pressed={isSelected}
              className={cn(
                "relative flex flex-col items-center justify-center p-6 rounded-xl text-white font-bold transition-all duration-200",
                GRADIENT_CLASSES[option.gradient],
                !submitting && "hover:scale-105",
                isSelected && "ring-4 ring-blue-500 ring-offset-2 ring-offset-white",
                submitting && !isSelected && "opacity-50",
                submitting && "cursor-not-allowed",
              )}
            >
              <span className="text-4xl mb-2">{option.icon}</span>
              <span className="text-lg">{option.label}</span>
              <span className="text-xs mt-1 text-white/80 font-normal text-center leading-tight">
                {option.description}
              </span>
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
