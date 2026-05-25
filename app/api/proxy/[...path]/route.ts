import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.CHORUS_API_URL || "http://localhost:8080";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("chorus_session")?.value;

  const upstream_url = `${API_BASE}/${path.join("/")}${request.nextUrl.search}`;

  const headers: Record<string, string> = {
    "X-Requested-With": "XMLHttpRequest",
  };

  // Forward content-type for requests with a body
  const ct = request.headers.get("Content-Type");
  if (ct) headers["Content-Type"] = ct;

  // Attach session as Bearer token so Spring Boot JwtAuthFilter accepts it
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const hasBody = !["GET", "HEAD", "DELETE"].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let upstream: Response | null = null;
  try {
    upstream = await fetch(upstream_url, {
      method: request.method,
      headers,
      body,
      // @ts-expect-error — Node 18+ fetch duplex required for streaming bodies
      duplex: "half",
    });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }

  // Pipe SSE streams straight through without buffering
  const contentType = upstream.headers.get("Content-Type") ?? "";
  if (contentType.includes("text/event-stream") && upstream.body) {
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const responseBody = await upstream.arrayBuffer();
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: { "Content-Type": contentType || "application/json" },
  });
}

export const GET     = proxy;
export const POST    = proxy;
export const PUT     = proxy;
export const PATCH   = proxy;
export const DELETE  = proxy;
