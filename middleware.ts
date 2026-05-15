import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { STEP_ROUTE_MAP } from "@/lib/step-routes"
import { createSession, getProgress } from "@/lib/session"

export const runtime = "nodejs"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/results") {
    return NextResponse.next()
  }

  const sessionId = request.cookies.get("sessionId")?.value
  const origin = request.nextUrl.origin

  if (!sessionId) {
    try {
      const session = await createSession()
      const response = NextResponse.redirect(new URL("/", request.url))
      response.cookies.set("sessionId", session.sessionId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      })
      return response
    } catch {
      // DB unavailable → pass through
    }
    return NextResponse.next()
  }

  try {
    const progress = await getProgress(sessionId)

    if (progress) {
      if (progress.isCompleted) {
        return NextResponse.redirect(new URL("/results", request.url))
      }

      const targetRoute = progress.currentStep
        ? STEP_ROUTE_MAP[progress.currentStep]
        : undefined
      if (targetRoute && pathname !== targetRoute) {
        const referer = request.headers.get("referer")
        const isSameOrigin = referer ? referer.startsWith(origin) : false
        if (isSameOrigin) {
          return NextResponse.next()
        }
        return NextResponse.redirect(new URL(targetRoute, request.url))
      }
    }
  } catch {
    // DB unavailable → pass through
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next|favicon).*)"],
}
