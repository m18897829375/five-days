"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import StepPage from "@/components/StepPage"
import { STEP_ROUTE_MAP } from "@/lib/step-routes"
import { cn } from "@/lib/utils"

const AGE_CARDS = [
  { range: "18-29" as const, emoji: "🧑", gradient: "blue", ariaLabel: "选择 18-29 岁 年龄段" },
  { range: "30-39" as const, emoji: "👨", gradient: "green", ariaLabel: "选择 30-39 岁 年龄段" },
  { range: "40-49" as const, emoji: "🧔", gradient: "orange", ariaLabel: "选择 40-49 岁 年龄段" },
  { range: "50+" as const, emoji: "👴", gradient: "purple", ariaLabel: "选择 50+ 岁 年龄段" },
]

const GRADIENT_CLASSES: Record<string, string> = {
  blue: "bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800",
  green: "bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800",
  orange: "bg-gradient-to-br from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800",
  purple: "bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800",
}

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(ageRange: string) {
    setLoading(ageRange)
    setError(null)

    try {
      const res = await fetch("/api/quiz/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "AGE_RANGE", data: { ageRange } }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error?.message || "服务器内部错误")
        setLoading(null)
        return
      }

      const route = STEP_ROUTE_MAP[data.nextStep]
      if (route) {
        router.push(route)
      }
    } catch {
      setError("网络请求失败，请检查网络连接后重试")
      setLoading(null)
    }
  }

  return (
    <StepPage title="选择您的年龄段" currentStep="AGE_RANGE">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {AGE_CARDS.map((card) => (
          <button
            key={card.range}
            onClick={() => handleSelect(card.range)}
            disabled={loading !== null}
            aria-label={card.ariaLabel}
            className={cn(
              "flex flex-col items-center justify-center p-6 rounded-xl text-white font-bold text-lg transition-all duration-200",
              GRADIENT_CLASSES[card.gradient],
              loading !== null && loading !== card.range && "opacity-50",
              loading === card.range && "ring-4 ring-white ring-offset-2 ring-offset-transparent",
            )}
          >
            <span className="text-4xl mb-2">{card.emoji}</span>
            <span>{card.range} 岁</span>
          </button>
        ))}
      </div>
    </StepPage>
  )
}
