"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ProgressBar from "@/components/ProgressBar"
import StepPage from "@/components/StepPage"

const GENDER_OPTIONS = [
  { value: "male", label: "男性", emoji: "👨", gradient: "from-blue-500 to-indigo-600" },
  { value: "female", label: "女性", emoji: "👩", gradient: "from-pink-400 to-rose-500" },
]

export default function GenderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleSelect = async (gender: string) => {
    setLoading(gender)
    setError("")
    try {
      const res = await fetch("/api/quiz/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "GENDER", data: { gender } }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error?.message ?? "网络错误，请重试")
        return
      }
      router.push("/quiz/body")
    } catch {
      setError("网络错误，请重试")
    } finally {
      setLoading(null)
    }
  }

  return (
    <StepPage title="选择你的性别">
      <ProgressBar currentStep="GENDER" completedSteps={["AGE_RANGE"]} />
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-4">
        {GENDER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={loading !== null}
            className={`rounded-2xl bg-gradient-to-br ${opt.gradient} p-8 text-center text-white transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-4 min-h-[100px] ${
              loading === opt.value ? "ring-4 ring-white/50" : ""
            } ${loading !== null && loading !== opt.value ? "opacity-50" : ""}`}
          >
            <span className="text-5xl">{opt.emoji}</span>
            <span className="text-2xl font-bold">{opt.label}</span>
          </button>
        ))}
      </div>
    </StepPage>
  )
}
