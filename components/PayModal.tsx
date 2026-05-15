"use client"

import { useState } from "react"

interface PayModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function PayModal({ onClose, onSuccess }: PayModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1 }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error?.message || "支付失败，请重试")
        setLoading(false)
        return
      }

      onSuccess()
    } catch {
      setError("网络请求失败，请检查网络连接后重试")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">解锁完整报告</h3>
        <p className="text-sm text-gray-500 mb-6">支付后即可查看完整体重预测和个性化方案</p>

        <div className="bg-blue-50 rounded-xl p-4 text-center mb-6">
          <p className="text-sm text-gray-500 mb-1">支付金额</p>
          <p className="text-4xl font-bold text-blue-600">¥1</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!error && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "支付中..." : "确认支付"}
            </button>
          </div>
        )}

        {error && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
