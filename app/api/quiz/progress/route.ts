import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getProgress } from "@/lib/session"

export async function GET() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("sessionId")?.value

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "未找到会话" } },
      { status: 401 },
    )
  }

  const progress = await getProgress(sessionId)
  if (!progress) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "无效会话" } },
      { status: 401 },
    )
  }

  return NextResponse.json({ success: true, data: progress })
}
