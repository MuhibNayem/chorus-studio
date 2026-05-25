import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/landing"];
const SESSION_COOKIE = "chorus_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Decode token to verify structure & expiration
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let isAuthed = false;

  if (token) {
    try {
      const [, payloadB64] = token.split(".");
      const padding = "=".repeat((4 - (payloadB64.length % 4)) % 4);
      const payload = JSON.parse(
        Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/") + padding, "base64").toString()
      );
      if (typeof payload.exp === "number" && payload.exp * 1000 >= Date.now()) {
        isAuthed = true;
      }
    } catch {
      isAuthed = false;
    }
  }

  // 2. Intercept authenticated users hitting public routes (/login, /register)
  if (isAuthed && PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 3. Allow unauthenticated users to hit public routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 4. Allow next.js internal assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // 5. Block unauthenticated users from guarded routes
  if (!isAuthed) {
    const res = redirectToLogin(request, pathname);
    if (token) {
      // Clear invalid/expired cookie
      res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    }
    return res;
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest, from: string) {
  const url = request.nextUrl.clone();
  // Unauthenticated visitors go to the landing page; the login link is there
  url.pathname = "/landing";
  url.searchParams.delete("from");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};

