"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import StepPage from "@/components/StepPage"
import { STEP_ROUTE_MAP } from "@/lib/step-routes"
import { bodyDataSchema } from "@/lib/schemas"
import type { z } from "zod"

interface FieldConfig {
  name: "age" | "height" | "currentWeight" | "targetWeight"
  label: string
  unit: string
  placeholder: string
}

const FIELDS: FieldConfig[] = [
  { name: "age", label: "年龄", unit: "年", placeholder: "输入年龄" },
  { name: "height", label: "身高 (cm)", unit: "cm", placeholder: "输入身高" },
  { name: "currentWeight", label: "当前体重 (kg)", unit: "kg", placeholder: "输入当前体重" },
  { name: "targetWeight", label: "目标体重 (kg)", unit: "kg", placeholder: "输入目标体重" },
]

function toChineseError(issue: z.ZodIssue): string {
  if (issue.code === "too_small") {
    return `最小值为 ${issue.minimum}`
  }
  if (issue.code === "too_big") {
    return `最大值为 ${issue.maximum}`
  }
  if (issue.code === "invalid_type") {
    return "请输入有效数字"
  }
  return issue.message
}

export default function BodyPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    age: "",
    height: "",
    currentWeight: "",
    targetWeight: "",
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const allEmpty =
    !formData.age && !formData.height && !formData.currentWeight && !formData.targetWeight

  async function handleSubmit() {
    setFieldErrors({})
    setApiError(null)

    const parsed = {
      age: parseInt(formData.age, 10),
      height: parseInt(formData.height, 10),
      currentWeight: parseInt(formData.currentWeight, 10),
      targetWeight: parseInt(formData.targetWeight, 10),
    }

    const result = bodyDataSchema.safeParse(parsed)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = String(issue.path[0])
        if (!errors[field]) {
          errors[field] = toChineseError(issue)
        }
      }
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/quiz/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "BODY_DATA", data: parsed }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setApiError(data.error?.message || "服务器内部错误")
        return
      }

      const route = STEP_ROUTE_MAP[data.data.nextStep]
      if (route) {
        router.push(route)
      }
    } catch {
      setApiError("网络请求失败，请检查网络连接后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <StepPage title="输入您的身体数据" currentStep="BODY_DATA">
      {apiError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
          {apiError}
        </div>
      )}

      <div className="space-y-4">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={`field-${field.name}`}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
            </label>
            <div className="relative">
              <input
                id={`field-${field.name}`}
                type="number"
                inputMode="numeric"
                value={formData[field.name]}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                }
                placeholder={field.placeholder}
                disabled={submitting}
                aria-label={field.label}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                {field.unit}
              </span>
            </div>
            {fieldErrors[field.name] && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors[field.name]}
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || allEmpty}
        className="mt-6 w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "提交中..." : "继续"}
      </button>
    </StepPage>
  )
}
