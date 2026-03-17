import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get("session")?.value;

  let isValidSession = false;
  let userRole = "user";

  if (sessionCookie) {
    try {
      const data = JSON.parse(decodeURIComponent(sessionCookie));
      if (data.uid && data.email) {
        isValidSession = true;
        userRole = data.role || "user";
      }
    } catch {
      // invalid cookie
    }
  }

  const protectedRoutes = ["/profile", "/register", "/admin"];
  const adminRoutes = ["/admin"];
  const authRoutes = ["/signin"];

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected) {
    if (!isValidSession) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    if (isAdminRoute && userRole !== "admin") {
      const url = new URL("/profile", request.url);
      url.searchParams.set("access_denied", "true");
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (authRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)",
  ],
};
