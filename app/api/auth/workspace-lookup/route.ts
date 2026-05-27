import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.CHORUS_API_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const upstream = await fetch(`${API_BASE}/api/v1/auth/workspace-lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email }),
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Always return the same message regardless of whether the email exists
  return NextResponse.json({
    message: "If that email is registered, workspace details have been sent.",
  });
}
