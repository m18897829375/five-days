"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import PayModal from "@/components/PayModal"

interface WeeklyProjection {
  week: number
  weight: number
  calories: number
}

interface PlanDetails {
  protein: { percentage: number; grams: number }
  carbs: { percentage: number; grams: number }
  fat: { percentage: number; grams: number }
  exercisePlan: string
  tips: string[]
}

interface HealthResult {
  bmi: number
  bmiCategory: string
  bmr: number
  tdee: number
  recommendedCalories: number
  targetDate: string
  weeklyProjection: WeeklyProjection[] | null
  planDetails: PlanDetails | null
  lockMessage?: string
}

interface ProgressData {
  ageRange?: string
  gender?: string
  age?: number
  height?: number
  currentWeight?: number
  targetWeight?: number
  goals?: string[]
  frequency?: string
}

const BMI_CATEGORY_LABEL: Record<string, string> = {
  underweight: "偏瘦",
  normal: "正常",
  overweight: "超重",
  obese: "肥胖",
}

const BMI_CATEGORY_COLOR: Record<string, string> = {
  underweight: "text-blue-600",
  normal: "text-green-600",
  overweight: "text-orange-600",
  obese: "text-red-600",
}

const BMI_CATEGORY_BG: Record<string, string> = {
  underweight: "bg-blue-50",
  normal: "bg-green-50",
  overweight: "bg-orange-50",
  obese: "bg-red-50",
}

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ")
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export default function ResultsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [subscription, setSubscription] = useState<string>("FREE")
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [showPayModal, setShowPayModal] = useState(false)

  const isPremium = subscription === "PREMIUM"

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [resResults, resProgress] = await Promise.all([
        fetch("/api/results"),
        fetch("/api/quiz/progress"),
      ])
      const jsonResults = await resResults.json()
      const jsonProgress = await resProgress.json()

      if (!resResults.ok) {
        if (resResults.status === 404) {
          setError("请先完成测评再查看结果")
        } else if (resResults.status === 401) {
          setError("会话已过期，请返回首页重新开始")
        } else {
          setError(jsonResults.error?.message ?? "加载失败，请刷新重试")
        }
        return
      }

      setResult(jsonResults.result)
      setSubscription(jsonResults.subscription ?? "FREE")
      if (jsonProgress.success && jsonProgress.data) {
        setProgress(jsonProgress.data)
      }
    } catch {
      setError("网络异常，请检查网络后重试")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePaySuccess = () => {
    setShowPayModal(false)
    fetchData()
  }

  const weightLoss =
    progress?.currentWeight != null && progress?.targetWeight != null
      ? Math.abs(progress.targetWeight - progress.currentWeight)
      : null

  if (loading) {
    return <Skeleton />
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-8"
      >
        <div className="mb-4 text-5xl">📋</div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">暂无结果</h2>
        <p className="mb-6 text-center text-gray-500">{error}</p>
        <a
          href="/"
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          开始测评
        </a>
      </motion.div>
    )
  }

  if (!result) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-lg px-4 py-8"
    >
      <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
        你的健康报告
      </h1>

      {/* Metric Cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <BMICard bmi={result.bmi} category={result.bmiCategory} />
        <MetricCard
          label="每日推荐"
          value={`${result.recommendedCalories}`}
          unit="kcal"
          icon="🔥"
        />
        <MetricCard
          label="目标日期"
          value={formatDate(result.targetDate)}
          icon="📅"
        />
        <MetricCard
          label="预估减重"
          value={weightLoss != null ? `${weightLoss}` : "--"}
          unit="kg"
          icon="⚖️"
        />
      </div>

      {/* Locked / Premium Sections */}
      {isPremium ? (
        <>
          <WeightChart data={result.weeklyProjection} />
          <PlanSection plan={result.planDetails} />
        </>
      ) : (
        <>
          <LockedArea type="chart">
            <div className="p-4 opacity-20">
              <ChartPreview />
            </div>
          </LockedArea>

          <LockedArea type="plan">
            <div className="space-y-3 p-4 opacity-20">
              <div className="h-3 w-3/4 rounded bg-gray-400" />
              <div className="h-3 w-1/2 rounded bg-gray-400" />
              <div className="h-3 w-2/3 rounded bg-gray-400" />
            </div>
          </LockedArea>

          <button
            onClick={() => setShowPayModal(true)}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
          >
            解锁完整方案 — ¥99
          </button>
        </>
      )}

      <PayModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        onSuccess={handlePaySuccess}
      />
    </motion.div>
  )
}

function BMICard({ bmi, category }: { bmi: number; category: string }) {
  return (
    <div
      className={cn(
        "col-span-1 rounded-2xl p-5 sm:col-span-2",
        BMI_CATEGORY_BG[category] ?? "bg-gray-50"
      )}
    >
      <p className="mb-1 text-sm text-gray-500">BMI 身体质量指数</p>
      <p className="mb-1 text-4xl font-bold text-gray-900">{bmi}</p>
      <span
        className={cn(
          "inline-block rounded-full px-3 py-0.5 text-sm font-semibold",
          BMI_CATEGORY_COLOR[category] ?? "text-gray-600",
          "bg-white/60"
        )}
      >
        {BMI_CATEGORY_LABEL[category] ?? category}
      </span>
    </div>
  )
}

function MetricCard({
  label,
  value,
  unit,
  icon,
}: {
  label: string
  value: string
  unit?: string
  icon: string
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <p className="mb-1 text-xs text-gray-500">
        {icon} {label}
      </p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {unit && <span className="ml-0.5 text-sm font-normal text-gray-500">{unit}</span>}
      </p>
    </div>
  )
}

function LockedArea({
  type,
  children,
}: {
  type: "chart" | "plan"
  children: React.ReactNode
}) {
  const title = type === "chart" ? "体重预测" : "饮食运动计划"
  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl bg-gray-50 shadow-sm ring-1 ring-gray-100">
      {children}
      <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-md bg-white/50">
        <span className="mb-2 text-3xl">🔒</span>
        <p className="mb-3 text-sm font-medium text-gray-600">{title}</p>
      </div>
    </div>
  )
}

function ChartPreview() {
  return (
    <svg viewBox="0 0 280 120" className="h-40 w-full">
      <polyline
        points="0,100 56,70 112,55 168,40 224,25 280,10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-blue-500"
      />
      {[56, 112, 168, 224, 280].map((cx, i) => (
        <circle key={i} cx={cx} cy={[70, 55, 40, 25, 10][i]} r="3" className="fill-blue-500" />
      ))}
    </svg>
  )
}

function WeightChart({ data }: { data: WeeklyProjection[] | null }) {
  if (!data || data.length === 0) {
    return (
      <div className="mb-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-1 text-lg font-semibold text-gray-900">体重预测</h3>
        <p className="text-sm text-gray-400">暂无预测数据</p>
      </div>
    )
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 44 }
  const w = 560
  const h = 240
  const cw = w - padding.left - padding.right
  const ch = h - padding.top - padding.bottom

  const weights = data.map((d) => d.weight)
  const minW = Math.min(...weights) - 1
  const maxW = Math.max(...weights) + 1

  const x = (i: number) => padding.left + (i / (data.length - 1)) * cw
  const y = (val: number) => padding.top + ch - ((val - minW) / (maxW - minW)) * ch

  const linePoints = data.map((d, i) => `${x(i)},${y(d.weight)}`).join(" ")

  const yTicks = 4
  const yStep = (maxW - minW) / (yTicks - 1)

  const maxLabelWeeks = Math.min(data.length, 8)
  const xLabelInterval = Math.max(1, Math.floor(data.length / maxLabelWeeks))

  return (
    <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">体重预测折线图</h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-60 w-full min-w-[400px]">
          {/* Grid lines */}
          {Array.from({ length: yTicks }, (_, i) => {
            const val = minW + i * yStep
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y(val)}
                  x2={w - padding.right}
                  y2={y(val)}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 6}
                  y={y(val) + 4}
                  textAnchor="end"
                  className="fill-gray-400 text-[10px]"
                >
                  {Math.round(val)}kg
                </text>
              </g>
            )
          })}

          {/* Line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(d.weight)}
              r="4"
              className="fill-blue-500 stroke-white"
              strokeWidth="2"
            />
          ))}

          {/* X labels */}
          {data.map((d, i) => {
            if (i % xLabelInterval !== 0 && i !== data.length - 1) return null
            return (
              <text
                key={i}
                x={x(i)}
                y={h - 8}
                textAnchor="middle"
                className="fill-gray-400 text-[10px]"
              >
                第{d.week}周
              </text>
            )
          })}
        </svg>
      </div>

      {/* Data table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="pb-2 font-medium">周次</th>
              <th className="pb-2 font-medium">体重 (kg)</th>
              <th className="pb-2 font-medium">热量 (kcal)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.week} className="border-b border-gray-50">
                <td className="py-1.5">第{d.week}周</td>
                <td className="py-1.5">{d.weight}</td>
                <td className="py-1.5">{d.calories}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlanSection({ plan }: { plan: PlanDetails | null }) {
  if (!plan) {
    return (
      <div className="mb-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-1 text-lg font-semibold text-gray-900">饮食运动计划</h3>
        <p className="text-sm text-gray-400">暂无计划数据</p>
      </div>
    )
  }

  return (
    <div className="mb-4 space-y-4">
      {/* Nutrition breakdown */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">营养三要素分解</h3>
        <div className="space-y-3">
          <NutritionBar
            label="蛋白质"
            pct={plan.protein.percentage}
            grams={plan.protein.grams}
            color="bg-red-500"
          />
          <NutritionBar
            label="碳水化合物"
            pct={plan.carbs.percentage}
            grams={plan.carbs.grams}
            color="bg-yellow-500"
          />
          <NutritionBar
            label="脂肪"
            pct={plan.fat.percentage}
            grams={plan.fat.grams}
            color="bg-blue-500"
          />
        </div>
      </div>

      {/* Exercise plan */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">运动计划</h3>
        <p className="rounded-xl bg-green-50 p-4 text-sm leading-relaxed text-green-800">
          {plan.exercisePlan}
        </p>
      </div>

      {/* Daily tips */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">每日建议</h3>
        <ul className="space-y-2">
          {plan.tips.map((tip, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="mt-0.5 shrink-0 text-blue-500">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function NutritionBar({
  label,
  pct,
  grams,
  color,
}: {
  label: string
  pct: number
  grams: number
  color: string
}) {
  const width = Math.max(pct, 2)
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {pct}%（{grams}g）
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-100">
        <div
          className={cn("h-2.5 rounded-full transition-all", color)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-lg animate-pulse px-4 py-8">
      <div className="mx-auto mb-8 h-8 w-48 rounded bg-gray-200" />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="col-span-1 rounded-2xl bg-gray-100 p-5 sm:col-span-2">
          <div className="mb-3 h-4 w-24 rounded bg-gray-200" />
          <div className="mb-2 h-10 w-20 rounded bg-gray-200" />
          <div className="h-6 w-12 rounded-full bg-gray-200" />
        </div>
        <div className="rounded-2xl bg-gray-100 p-4">
          <div className="mb-2 h-3 w-16 rounded bg-gray-200" />
          <div className="h-8 w-24 rounded bg-gray-200" />
        </div>
        <div className="rounded-2xl bg-gray-100 p-4">
          <div className="mb-2 h-3 w-16 rounded bg-gray-200" />
          <div className="h-8 w-20 rounded bg-gray-200" />
        </div>
        <div className="rounded-2xl bg-gray-100 p-4">
          <div className="mb-2 h-3 w-16 rounded bg-gray-200" />
          <div className="h-8 w-20 rounded bg-gray-200" />
        </div>
        <div className="rounded-2xl bg-gray-100 p-4">
          <div className="mb-2 h-3 w-16 rounded bg-gray-200" />
          <div className="h-8 w-20 rounded bg-gray-200" />
        </div>
      </div>

      <div className="mb-4 h-48 rounded-2xl bg-gray-100" />
      <div className="mb-4 h-32 rounded-2xl bg-gray-100" />
      <div className="h-14 rounded-xl bg-gray-200" />
    </div>
  )
}
