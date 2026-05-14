"use client"

import { AlertTriangle } from "lucide-react"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-8">
      <AlertTriangle className="mb-4 h-12 w-12 text-blue-600" />
      <h2 className="mb-2 text-xl font-semibold text-gray-900">出错了</h2>
      <p className="mb-6 text-center text-gray-500">
        页面加载失败，请稍后重试
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          重试
        </button>
        <a
          href="/"
          className="rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
        >
          返回首页
        </a>
      </div>
    </div>
  )
}
