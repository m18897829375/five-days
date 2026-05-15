import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSession } from "@/lib/session"

export async function POST() {
  const cookieStore = await cookies()
  const existingSessionId = cookieStore.get("sessionId")?.value

  if (existingSessionId) {
    const user = await prisma.user.findUnique({
      where: { sessionId: existingSessionId },
    })
    if (user) {
      return NextResponse.json(
        { success: true, data: { sessionId: user.sessionId, subscription: user.subscription } },
        { status: 200 },
      )
    }
  }

  const session = await createSession()

  return NextResponse.json(
    { success: true, data: { sessionId: session.sessionId, subscription: session.subscription } },
    { status: 201 },
  )
}
