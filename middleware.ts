import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { STEP_ROUTE_MAP } from "@/lib/step-routes"

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl

  let sessionId = request.cookies.get("sessionId")?.value

  if (!sessionId) {
    try {
      const sessionRes = await fetch(`${origin}/api/session`, { method: "POST" })
      if (sessionRes.ok) {
        const body = await sessionRes.json()
        sessionId = body.sessionId
      }
    } catch {
      return NextResponse.next()
    }
  }

  if (!sessionId) {
    return NextResponse.next()
  }

  let response: NextResponse

  try {
    const progressRes = await fetch(`${origin}/api/quiz/progress`, {
      headers: { Cookie: `sessionId=${sessionId}` },
    })

    if (progressRes.ok) {
      const progress = await progressRes.json()

      if (progress.isCompleted && pathname !== "/results") {
        response = NextResponse.redirect(new URL("/results", request.url))
      } else if (!progress.isCompleted && progress.currentStep) {
        const correctRoute = STEP_ROUTE_MAP[progress.currentStep]
        if (correctRoute && pathname !== correctRoute) {
          response = NextResponse.redirect(new URL(correctRoute, request.url))
        } else {
          response = NextResponse.next()
        }
      } else {
        response = NextResponse.next()
      }
    } else {
      response = NextResponse.next()
    }
  } catch {
    response = NextResponse.next()
  }

  if (!request.cookies.get("sessionId")) {
    response.cookies.set({
      name: "sessionId",
      value: sessionId,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    })
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
