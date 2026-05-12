"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface PayModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PayModal({ isOpen, onClose, onSuccess }: PayModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePay = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 99 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error?.message ?? "支付失败，请重试")
        return
      }
      onSuccess()
    } catch {
      setError("网络异常，请检查网络后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError("")
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="mb-1 text-center text-xl font-bold text-gray-900">
              解锁完整方案
            </h2>
            <p className="mb-4 text-center text-sm text-gray-500">
              获取个性化饮食运动计划、体重预测图表
            </p>

            <div className="mb-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 py-5 text-center">
              <span className="text-4xl font-bold text-blue-600">¥99</span>
              <p className="mt-1 text-xs text-gray-400">一次性付费，永久解锁</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handlePay}
                disabled={loading}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "支付中..." : error ? "重试" : "确认支付"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
