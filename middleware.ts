import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const STEP_ROUTES: Record<string, string> = {
  AGE_RANGE: "/",
  GENDER: "/quiz/gender",
  BODY_DATA: "/quiz/body",
  GOALS: "/quiz/goals",
  EXERCISE_FREQUENCY: "/quiz/exercise",
}

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl
  const sessionId = request.cookies.get("sessionId")?.value

  if (!sessionId) {
    if (pathname === "/") {
      const res = await fetch(`${origin}/api/session`, { method: "POST" })
      if (!res.ok) return NextResponse.next()
      const data = await res.json()
      const response = NextResponse.next()
      response.cookies.set({
        name: "sessionId",
        value: data.sessionId,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 604800,
      })
      return response
    }
    return NextResponse.redirect(new URL("/", request.url))
  }

  let progress: { success?: boolean; currentStep: string | null; isCompleted: boolean }
  try {
    const progressRes = await fetch(`${origin}/api/quiz/progress`, {
      headers: { cookie: `sessionId=${sessionId}` },
    })
    if (progressRes.status === 401) {
      const response = NextResponse.redirect(new URL("/", request.url))
      response.cookies.delete("sessionId")
      return response
    }
    if (!progressRes.ok) return NextResponse.next()
    progress = await progressRes.json()
  } catch {
    return NextResponse.next()
  }

  if (progress.isCompleted) {
    if (pathname !== "/results") {
      return NextResponse.redirect(new URL("/results", request.url))
    }
    return NextResponse.next()
  }

  if (pathname === "/results") {
    const targetRoute = STEP_ROUTES[progress.currentStep || "AGE_RANGE"]
    return NextResponse.redirect(new URL(targetRoute, request.url))
  }

  const expectedRoute = STEP_ROUTES[progress.currentStep || "AGE_RANGE"]
  if (pathname !== expectedRoute) {
    return NextResponse.redirect(new URL(expectedRoute, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/quiz/:path*", "/results"],
}
