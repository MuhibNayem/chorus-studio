import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.CHORUS_API_URL || "http://localhost:8080";
const SESSION_COOKIE = "chorus_session";
const REFRESH_COOKIE = "chorus_refresh";
const ACCESS_MAX_AGE  = 60 * 15;       // 15 min
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const upstream = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ error: "Auth service unavailable" }, { status: 503 });
  }

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  const res = NextResponse.json({
    userId: data.userId,
    email: data.email,
    displayName: data.displayName,
    tenantId: data.tenantId,
    permissions: data.permissions ?? [],
  });

  res.cookies.set(SESSION_COOKIE, data.token ?? "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  res.cookies.set(REFRESH_COOKIE, data.refreshToken ?? "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
