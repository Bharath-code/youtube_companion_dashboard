import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Allow access to health check without authentication
  if (nextUrl.pathname.startsWith("/api/health")) {
    return NextResponse.next()
  }

  // Allow access to auth pages without authentication
  if (nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  // Redirect to signin if not authenticated
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}