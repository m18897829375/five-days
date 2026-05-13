"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import MetricCard from "@/components/MetricCard"
import FrostedOverlay from "@/components/FrostedOverlay"
import Skeleton from "@/components/Skeleton"

interface ResultData {
  bmi: number
  bmiCategory: string
  recommendedCalories: number
  targetDate: string
  currentWeight: number
  targetWeight: number
  lockMessage?: string
}

const BMI_CATEGORY_LABELS: Record<string, string> = {
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{
    type: "not_found" | "network"
  } | null>(null)
  const [data, setData] = useState<ResultData | null>(null)

  useEffect(() => {
    fetch("/api/results")
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) {
          const msg: string = json?.error?.message ?? ""
          if (msg === "未找到会话" || msg === "无效会话") {
            router.push("/")
            return
          }
          if (msg === "请先完成测评") {
            setLoading(false)
            setError({ type: "not_found" })
            return
          }
          setLoading(false)
          setError({ type: "network" })
          return
        }
        setData(json.result)
        setError(null)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        setError({ type: "network" })
      })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl mb-4" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error?.type === "not_found") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-4">请先完成测评</p>
          <a
            href="/"
            className="text-amber-500 hover:text-amber-600 underline font-medium"
          >
            返回首页开始测评
          </a>
        </div>
      </div>
    )
  }

  if (error?.type === "network") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-4">加载失败，请重试</p>
          <button
            onClick={() => {
              setLoading(true)
              setError(null)
              window.location.reload()
            }}
            className="px-6 py-2.5 bg-amber-400 text-white rounded-full font-semibold hover:bg-amber-500 transition"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  const loss = Math.abs(data!.targetWeight - data!.currentWeight)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          你的健康评估结果
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <MetricCard
            label="BMI 身体质量指数"
            value={data!.bmi.toFixed(1)}
            subtext={BMI_CATEGORY_LABELS[data!.bmiCategory] ?? data!.bmiCategory}
          />
          <MetricCard
            label="每日推荐摄入"
            value={data!.recommendedCalories}
            unit="kcal/天"
          />
          <MetricCard
            label="预计达成日期"
            value={formatDate(data!.targetDate)}
          />
          <MetricCard
            label="预估体重变化"
            value={loss}
            unit="kg"
          />
        </div>

        <div className="mb-4">
          <FrostedOverlay
            title="体重预测曲线"
            showCta
            ctaText="解锁完整方案 — ¥99"
          >
            <div className="bg-white rounded-xl p-6 min-h-[200px]">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                体重变化预测
              </h3>
              <p className="text-gray-500">
                此处展示你未来12周基于每日摄入目标的体重变化预测曲线，帮你直观了解减重进度。
              </p>
            </div>
          </FrostedOverlay>
        </div>

        <FrostedOverlay title="饮食与运动方案">
          <div className="bg-white rounded-xl p-6 min-h-[200px]">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              个性化饮食与运动方案
            </h3>
            <p className="text-gray-500">
              此处展示根据你的身体数据、目标和运动频率定制的每日营养配比、食谱推荐和运动计划。
            </p>
          </div>
        </FrostedOverlay>
      </div>
    </div>
  )
}
