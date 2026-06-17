import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight cookie-based gate. Full authorization is enforced in each
// server component / route handler via `auth()` from src/auth.ts.
const PROTECTED = ["/dashboard", "/trips", "/admin", "/favorites", "/account"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isProtected) return NextResponse.next();

  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/trips/:path*", "/admin/:path*", "/favorites/:path*", "/account/:path*"],
};
