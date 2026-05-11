import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const paySchema = z.object({
  amount: z.number(),
})

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("sessionId")?.value

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "未找到会话，请先访问首页" } },
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "请求体必须为 JSON" } },
      { status: 400 },
    )
  }

  const result = paySchema.safeParse(body)
  if (!result.success) {
    const issue = result.error.issues[0]
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: issue.message,
          field: issue.path.join("."),
          received: (issue as unknown as { received?: unknown }).received,
        },
      },
      { status: 400 },
    )
  }

  const { amount } = result.data

  if (user.subscription === "PREMIUM") {
    return NextResponse.json(
      { success: false, error: { code: "ALREADY_PREMIUM", message: "您已是高级会员" } },
      { status: 409 },
    )
  }

  if (amount === 0) {
    await prisma.paymentRecord.create({
      data: { userId: user.id, amount: 0, status: "FAILED" },
    })

    return NextResponse.json(
      { success: false, error: { code: "PAYMENT_FAILED", message: "支付失败，请重试" } },
      { status: 400 },
    )
  }

  if (amount !== 99) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "金额必须为99元",
          field: "amount",
          received: amount,
        },
      },
      { status: 400 },
    )
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { subscription: "PREMIUM" },
    }),
    prisma.paymentRecord.create({
      data: { userId: user.id, amount: 99, status: "COMPLETED" },
    }),
  ])

  return NextResponse.json(
    { success: true, subscription: "PREMIUM", message: "支付成功" },
    { status: 200 },
  )
}
