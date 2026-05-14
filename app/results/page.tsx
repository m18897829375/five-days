"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import MetricCard from "@/components/MetricCard"
import FrostedOverlay from "@/components/FrostedOverlay"
import Skeleton from "@/components/Skeleton"
import PayModal from "@/components/PayModal"
import WeightChart from "@/components/WeightChart"
import PlanDetails from "@/components/PlanDetails"
import { cn } from "@/lib/utils"

interface WeeklyProjectionItem {
  week: number
  weight: number
  calories: number
}

interface PlanDetailsData {
  protein: { percentage: number; grams: number }
  carbs: { percentage: number; grams: number }
  fat: { percentage: number; grams: number }
  exercisePlan: string
  tips: string[]
}

interface ResultsData {
  bmi: number
  bmiCategory: string
  bmr: number
  recommendedCalories: number
  targetDate: string
  currentWeight: number
  targetWeight: number
  subscription: string
  weeklyProjection: WeeklyProjectionItem[] | null
  planDetails: PlanDetailsData | null
  lockMessage?: string
}

const BMI_LABEL: Record<string, string> = {
  underweight: "偏瘦",
  normal: "正常",
  overweight: "超重",
  obese: "肥胖",
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, "0")}月${String(d.getDate()).padStart(2, "0")}日`
}

export default function ResultsPage() {
  const router = useRouter()
  const [data, setData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ code?: string; message?: string } | null>(null)
  const [showPayModal, setShowPayModal] = useState(false)

  async function fetchResults() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/results")

      if (res.status === 401) {
        router.push("/")
        return
      }

      const json = await res.json()

      if (!res.ok) {
        setError({ code: json.error?.code, message: json.error?.message || "加载失败" })
        setLoading(false)
        return
      }

      setData(json.data)
    } catch {
      setError({ message: "网络请求失败，请检查网络连接后重试" })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Loading state
  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">测评结果</h1>
        <div className={cn("grid gap-4", "grid-cols-1 sm:grid-cols-2")}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-48 mt-6" />
        <Skeleton className="h-48 mt-6" />
      </main>
    )
  }

  // Error state — incomplete quiz
  if (error?.code === "NOT_FOUND") {
    return (
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-4">{error.message || "请先完成测评"}</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          开始测评
        </Link>
      </main>
    )
  }

  // Error state — network or other errors
  if (error) {
    return (
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-4">{error.message || "加载失败，请重试"}</p>
        <button
          onClick={fetchResults}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          重试
        </button>
      </main>
    )
  }

  // No data
  if (!data) return null

  const weightChange = Math.abs(data.targetWeight - data.currentWeight).toFixed(1)
  const isPremium = data.subscription === "PREMIUM"

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">测评结果</h1>

      {/* Metric cards grid */}
      <div className={cn("grid gap-4", "grid-cols-1 sm:grid-cols-2")}>
        <MetricCard
          label="BMI 指数"
          value={data.bmi.toFixed(1)}
          subtext={BMI_LABEL[data.bmiCategory] ?? data.bmiCategory}
        />
        <MetricCard
          label="每日摄入"
          value={data.recommendedCalories}
          unit="kcal/天"
        />
        <MetricCard
          label="预计达成"
          value={formatDate(data.targetDate)}
        />
        <MetricCard
          label="体重变化"
          value={weightChange}
          unit="kg"
        />
      </div>

      {/* Weight projection */}
      <div className="relative mt-6 bg-white rounded-xl border border-gray-100 p-6 min-h-48">
        <h2 className="text-lg font-semibold mb-4">体重预测</h2>
        {isPremium && data.weeklyProjection ? (
          <WeightChart data={data.weeklyProjection} />
        ) : (
          <>
            <p className="text-gray-400 text-sm">根据你的身体数据和目标，系统将生成每周体重变化趋势预测。</p>
            <FrostedOverlay showCta ctaText="解锁完整方案 — ¥1" onCtaClick={() => setShowPayModal(true)} />
          </>
        )}
      </div>

      {/* Diet/exercise plan */}
      <div className="relative mt-6 bg-white rounded-xl border border-gray-100 p-6 min-h-48">
        <h2 className="text-lg font-semibold mb-4">饮食与运动方案</h2>
        {isPremium && data.planDetails ? (
          <PlanDetails data={data.planDetails} />
        ) : (
          <>
            <p className="text-gray-400 text-sm">解锁后将显示个性化每日营养配比、食谱建议和运动训练计划。</p>
            <FrostedOverlay showCta={false} />
          </>
        )}
      </div>

      {/* Pay modal */}
      {showPayModal && (
        <PayModal
          onClose={() => setShowPayModal(false)}
          onSuccess={() => {
            setShowPayModal(false)
            fetchResults()
          }}
        />
      )}
    </main>
  )
}
