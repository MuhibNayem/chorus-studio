import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.CHORUS_API_URL || "http://localhost:8080";

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("chorus_session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const upstream = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ error: "Auth service unavailable" }, { status: 503 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json(await upstream.json());
}
