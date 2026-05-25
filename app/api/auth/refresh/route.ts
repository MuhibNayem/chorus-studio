import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.CHORUS_API_URL || "http://localhost:8080";

export async function POST(_request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("chorus_refresh")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const upstream = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => null);

  if (!upstream || !upstream.ok) {
    const res = NextResponse.json({ error: "Session expired, please log in again" }, { status: 401 });
    res.cookies.set("chorus_session", "", { maxAge: 0, path: "/" });
    res.cookies.set("chorus_refresh", "", { maxAge: 0, path: "/api/auth" });
    return res;
  }

  const data = await upstream.json();
  const res = NextResponse.json({
    userId: data.userId,
    email: data.email,
    displayName: data.displayName,
    tenantId: data.tenantId,
    permissions: data.permissions ?? [],
  });

  res.cookies.set("chorus_session", data.token ?? "", {
    httpOnly: true, sameSite: "lax", path: "/",
    maxAge: 60 * 15,
    secure: process.env.NODE_ENV === "production",
  });
  res.cookies.set("chorus_refresh", data.refreshToken ?? "", {
    httpOnly: true, sameSite: "lax", path: "/api/auth",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
