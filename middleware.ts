import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { STEP_ROUTE_MAP } from "@/lib/step-routes"

const RESULTS_ROUTE = "/results"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let sessionId = request.cookies.get("sessionId")?.value

  if (!sessionId) {
    const origin = request.nextUrl.origin
    const sessionRes = await fetch(`${origin}/api/session`, { method: "POST" })
    if (sessionRes.ok) {
      const body = await sessionRes.json()
      sessionId = body.sessionId as string | undefined
    }

    if (sessionId) {
      const response = NextResponse.next()
      response.cookies.set({
        name: "sessionId",
        value: sessionId,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 604800,
      })
      return response
    }

    return NextResponse.next()
  }

  const origin = request.nextUrl.origin
  let progressData: {
    currentStep?: string | null
    completedSteps?: string[]
    isCompleted?: boolean
  } = {}

  try {
    const progressRes = await fetch(`${origin}/api/quiz/progress`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    })
    if (progressRes.ok) {
      progressData = await progressRes.json()
    } else if (progressRes.status === 401) {
      const response = NextResponse.next()
      response.cookies.delete("sessionId")
      return response
    }
  } catch {
    return NextResponse.next()
  }

  if (progressData.isCompleted && pathname !== RESULTS_ROUTE) {
    return NextResponse.redirect(new URL(RESULTS_ROUTE, request.url), 307)
  }

  if (progressData.currentStep) {
    const targetRoute = STEP_ROUTE_MAP[progressData.currentStep]
    if (targetRoute && targetRoute !== pathname) {
      return NextResponse.redirect(new URL(targetRoute, request.url), 307)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
