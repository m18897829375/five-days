import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { STEP_ROUTE_MAP } from "@/lib/step-routes"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow /results to pass through unconditionally
  if (pathname === "/results") {
    return NextResponse.next()
  }

  const sessionId = request.cookies.get("sessionId")?.value
  const origin = request.nextUrl.origin

  // No session cookie → create one
  if (!sessionId) {
    try {
      const sessionRes = await fetch(`${origin}/api/session`, { method: "POST" })
      if (sessionRes.ok) {
        const data = await sessionRes.json()
        if (data.sessionId && typeof data.sessionId === "string") {
          const response = NextResponse.redirect(new URL("/", request.url))
          response.cookies.set("sessionId", data.sessionId, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
          })
          return response
        }
      }
    } catch {
      // API unavailable → pass through
    }
    return NextResponse.next()
  }

  // Check progress and redirect to correct step if needed
  try {
    const progressRes = await fetch(`${origin}/api/quiz/progress`, {
      headers: { Cookie: `sessionId=${sessionId}` },
    })

    if (progressRes.ok) {
      const progress = await progressRes.json()

      if (progress.isCompleted) {
        return NextResponse.redirect(new URL("/results", request.url))
      }

      const targetRoute = STEP_ROUTE_MAP[progress.currentStep]
      if (targetRoute && pathname !== targetRoute) {
        return NextResponse.redirect(new URL(targetRoute, request.url))
      }
    }
  } catch {
    // API unavailable → pass through
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next|favicon).*)"],
}
