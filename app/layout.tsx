import type { Metadata } from "next"
import "./globals.css"
import PageTransition from "@/components/PageTransition"

export const metadata: Metadata = {
  title: "健康测评",
  description: "个性化健康测评系统",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  )
}
