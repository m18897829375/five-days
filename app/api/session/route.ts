import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const cookieStore = await cookies()
  const existingSessionId = cookieStore.get("sessionId")?.value

  if (existingSessionId) {
    const user = await prisma.user.findUnique({
      where: { sessionId: existingSessionId },
    })
    if (user) {
      return NextResponse.json(
        { success: true, sessionId: user.sessionId, subscription: user.subscription },
        { status: 200 },
      )
    }
  }

  const sessionId = crypto.randomUUID()
  const user = await prisma.user.create({
    data: { sessionId, subscription: "FREE" },
  })

  cookieStore.set({
    name: "sessionId",
    value: sessionId,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  })

  return NextResponse.json(
    { success: true, sessionId: user.sessionId, subscription: user.subscription },
    { status: 201 },
  )
}
