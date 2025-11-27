import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes that require authentication
const protectedRoutes = ["/", "/buses", "/drivers", "/workers", "/live-tracking", "/metrics"]

// Define public routes that don't require authentication
const publicRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))

  // Get the auth token from cookies (not localStorage since middleware runs on server)
  const authToken = request.cookies.get("authToken")?.value

  // If accessing a protected route without auth token, redirect to login
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL("/auth/login", request.url)
    // Only add redirect param if not already on login page
    if (pathname !== "/auth/login") {
      loginUrl.searchParams.set("redirect", pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // If accessing a public route with auth token, redirect to dashboard
  // But allow if there's a redirect parameter (user is logging in)
  if (isPublicRoute && authToken && !request.nextUrl.searchParams.has("redirect")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
