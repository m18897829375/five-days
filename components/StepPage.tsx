"use client"

import { type ReactNode } from "react"
import { motion } from "framer-motion"

interface StepPageProps {
  title: string
  children: ReactNode
  onContinue?: () => void
  continueLabel?: string
  continueDisabled?: boolean
}

export default function StepPage({
  title,
  children,
  onContinue,
  continueLabel = "继续",
  continueDisabled = false,
}: StepPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8"
    >
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        {title}
      </h1>

      <main className="flex-1">{children}</main>

      {onContinue && (
        <footer className="mt-8 pb-8">
          <button
            onClick={onContinue}
            disabled={continueDisabled}
            className={`w-full rounded-xl py-3.5 text-lg font-semibold transition-colors ${
              continueDisabled
                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {continueLabel}
          </button>
        </footer>
      )}
    </motion.div>
  )
}
