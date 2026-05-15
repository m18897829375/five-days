"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import StepPage from "@/components/StepPage"
import { STEP_ROUTE_MAP } from "@/lib/step-routes"
import { cn } from "@/lib/utils"

const GENDER_OPTIONS = [
  { value: "male" as const, symbol: "♂", gradient: "blue", ariaLabel: "选择男性", label: "男性" },
  { value: "female" as const, symbol: "♀", gradient: "pink", ariaLabel: "选择女性", label: "女性" },
]

const GRADIENT_CLASSES: Record<string, string> = {
  blue: "bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800",
  pink: "bg-gradient-to-br from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800",
}

export default function GenderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(gender: string) {
    setLoading(gender)
    setError(null)

    try {
      const res = await fetch("/api/quiz/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "GENDER", data: { gender } }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error?.message || "服务器内部错误")
        setLoading(null)
        return
      }

      const route = STEP_ROUTE_MAP[data.data.nextStep]
      if (route) {
        router.push(route)
      }
    } catch {
      setError("网络请求失败，请检查网络连接后重试")
      setLoading(null)
    }
  }

  return (
    <StepPage title="选择您的性别" currentStep="GENDER">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {GENDER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            disabled={loading !== null}
            aria-label={option.ariaLabel}
            className={cn(
              "flex flex-col items-center justify-center p-8 rounded-xl text-white font-bold text-lg transition-all duration-200",
              GRADIENT_CLASSES[option.gradient],
              loading !== null && loading !== option.value && "opacity-50",
              loading === option.value && "ring-4 ring-white ring-offset-2 ring-offset-transparent",
            )}
          >
            <span className="text-5xl mb-3">{option.symbol}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </StepPage>
  )
}
