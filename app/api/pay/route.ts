import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("sessionId")?.value

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "未找到会话" } },
      { status: 401 },
    )
  }

  const user = await prisma.user.findUnique({ where: { sessionId } })
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "无效会话" } },
      { status: 401 },
    )
  }

  if (user.subscription === "PREMIUM") {
    return NextResponse.json(
      { success: false, error: { code: "ALREADY_PREMIUM", message: "您已是PREMIUM用户" } },
      { status: 409 },
    )
  }

  let body: { amount?: unknown; fail?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "请求体必须为 JSON" } },
      { status: 400 },
    )
  }

  const amount = typeof body.amount === "number" ? body.amount : 99

  if (body.fail === true) {
    await prisma.paymentRecord.create({
      data: {
        userId: user.id,
        amount,
        status: "FAILED",
      },
    })

    return NextResponse.json(
      { success: false, error: { code: "PAYMENT_FAILED", message: "支付失败，请重试" } },
      { status: 402 },
    )
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { subscription: "PREMIUM" },
    })
    await tx.paymentRecord.create({
      data: {
        userId: user.id,
        amount,
        status: "COMPLETED",
      },
    })
  })

  return NextResponse.json(
    { success: true, subscription: "PREMIUM", message: "支付成功" },
    { status: 200 },
  )
}
