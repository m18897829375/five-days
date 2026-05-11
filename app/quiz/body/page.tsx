"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ProgressBar from "@/components/ProgressBar"
import StepPage from "@/components/StepPage"
import { STEP_ROUTE_MAP } from "@/lib/step-routes"
import { bodyDataSchema } from "@/lib/schemas"

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ")
}

const FIELD_RANGES: Record<string, string> = {
  age: "年龄需在 10-120 之间",
  height: "身高需在 50-300 之间",
  currentWeight: "当前体重需在 20-500 之间",
  targetWeight: "目标体重需在 20-500 之间",
}

function formatFieldError(field: string, code: string): string {
  if (code === "too_small" || code === "too_big") {
    return FIELD_RANGES[field] ?? "输入值超出范围"
  }
  if (code === "invalid_type") return "请输入有效数字"
  return "输入无效"
}

type FieldName = "age" | "height" | "currentWeight" | "targetWeight"

interface FieldErrors {
  age?: string
  height?: string
  currentWeight?: string
  targetWeight?: string
}

const FIELDS: { name: FieldName; label: string; unit: string; placeholder: string }[] = [
  { name: "age", label: "年龄", unit: "岁", placeholder: "25" },
  { name: "height", label: "身高", unit: "cm", placeholder: "175" },
  { name: "currentWeight", label: "当前体重", unit: "kg", placeholder: "70" },
  { name: "targetWeight", label: "目标体重", unit: "kg", placeholder: "65" },
]

export default function BodyPage() {
  const router = useRouter()
  const [values, setValues] = useState<Record<FieldName, string>>({
    age: "",
    height: "",
    currentWeight: "",
    targetWeight: "",
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  function setValue(field: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  async function handleContinue() {
    setError("")

    const parsed = {
      age: Number(values.age),
      height: Number(values.height),
      currentWeight: Number(values.currentWeight),
      targetWeight: Number(values.targetWeight),
    }

    const result = bodyDataSchema.safeParse(parsed)

    if (!result.success) {
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as FieldName
        if (!errors[field]) {
          errors[field] = formatFieldError(field, issue.code)
        }
      }
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setSubmitting(true)

    try {
      const res = await fetch("/api/quiz/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "BODY_DATA", data: parsed }),
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
      title="输入你的身体数据"
      onContinue={handleContinue}
      continueLabel={submitting ? "提交中..." : "继续"}
      continueDisabled={submitting}
    >
      <ProgressBar currentStep="BODY_DATA" completedSteps={["AGE_RANGE", "GENDER"]} />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-5">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {field.label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={values[field.name]}
                onChange={(e) => setValue(field.name, e.target.value)}
                aria-label={`输入${field.label}`}
                className={cn(
                  "w-full rounded-xl border bg-white px-4 py-3 text-lg transition-colors focus:outline-none focus:ring-2",
                  fieldErrors[field.name]
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                )}
                placeholder={field.placeholder}
              />
              <span className="w-10 text-center text-sm text-gray-500">{field.unit}</span>
            </div>
            {fieldErrors[field.name] && (
              <p className="mt-1 text-sm text-red-500">{fieldErrors[field.name]}</p>
            )}
          </div>
        ))}
      </div>
    </StepPage>
  )
}
