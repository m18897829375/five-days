"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ProgressBar from "@/components/ProgressBar"
import StepPage from "@/components/StepPage"

const STEP_ROUTE_MAP: Record<string, string> = {
  AGE_RANGE: "/",
  GENDER: "/quiz/gender",
  BODY_DATA: "/quiz/body",
  GOALS: "/quiz/goals",
  EXERCISE_FREQUENCY: "/quiz/exercise",
}

const AGE_OPTIONS = [
  { value: "18-29", label: "18-29 岁", emoji: "🧑", gradient: "from-blue-400 to-blue-600" },
  { value: "30-39", label: "30-39 岁", emoji: "👨", gradient: "from-green-400 to-green-600" },
  { value: "40-49", label: "40-49 岁", emoji: "🧔", gradient: "from-orange-400 to-orange-600" },
  { value: "50+", label: "50+ 岁", emoji: "👴", gradient: "from-purple-400 to-purple-600" },
]

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleSelect = async (ageRange: string) => {
    setLoading(ageRange)
    setError("")
    try {
      const res = await fetch("/api/quiz/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "AGE_RANGE", data: { ageRange } }),
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
      setLoading(null)
    }
  }

  return (
    <StepPage title="选择你的年龄段">
      <ProgressBar currentStep="AGE_RANGE" completedSteps={[]} />
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        {AGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={loading !== null}
            className={`rounded-2xl bg-gradient-to-br ${opt.gradient} p-6 text-center text-white transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed flex min-h-[120px] flex-col items-center justify-center gap-2 ${
              loading === opt.value ? "ring-4 ring-white/50" : ""
            } ${loading !== null && loading !== opt.value ? "opacity-50" : ""}`}
          >
            <span className="text-5xl">{opt.emoji}</span>
            <span className="text-lg font-semibold">{opt.label}</span>
          </button>
        ))}
      </div>
    </StepPage>
  )
}
