"use client"

import { motion } from "framer-motion"

export default function ResultsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-lg px-4 py-8"
    >
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        你的健康报告
      </h1>
      <p className="text-center text-gray-500">结果页数据展示（US-013/US-014 实现）</p>
    </motion.div>
  )
}
