import { Search } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-8">
      <Search className="mb-4 h-16 w-16 text-blue-600" />
      <h2 className="mb-2 text-xl font-semibold text-gray-900">页面未找到</h2>
      <p className="mb-6 text-center text-gray-500">
        你访问的页面不存在或已被移除
      </p>
      <Link
        href="/"
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        返回首页
      </Link>
    </div>
  )
}
