import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.CHORUS_API_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("chorus_session")?.value;
  const refreshToken = cookieStore.get("chorus_refresh")?.value;

  // Notify backend to revoke the JTI + refresh token
  if (sessionToken) {
    await fetch(`${API_BASE}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null); // best-effort
  }

  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.set("chorus_session", "", { maxAge: 0, path: "/" });
  res.cookies.set("chorus_refresh", "", { maxAge: 0, path: "/api/auth" });
  return res;
}
