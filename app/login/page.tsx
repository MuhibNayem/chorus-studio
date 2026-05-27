"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

/* ─── Shared CSS ────────────────────────────────────────── */
const CSS = `
  @keyframes orb1 {
    0%,100% { transform: translate(0,0) scale(1); }
    40%      { transform: translate(80px,-60px) scale(1.1); }
    70%      { transform: translate(-40px,80px) scale(0.92); }
  }
  @keyframes orb2 {
    0%,100% { transform: translate(0,0) scale(1); }
    35%     { transform: translate(-70px,50px) scale(1.08); }
    65%     { transform: translate(60px,-40px) scale(0.95); }
  }
  @keyframes orb3 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%     { transform: translate(40px,70px) scale(1.12); }
  }
  @keyframes float {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-8px); }
  }
  @keyframes floatB {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-6px); }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  @keyframes beam-x {
    0%   { width: 0; opacity: 0; }
    15%  { opacity: 1; }
    85%  { opacity: 1; }
    100% { width: 100%; opacity: 0; }
  }
  @keyframes beam-y {
    0%   { height: 0; opacity: 0; }
    15%  { opacity: 1; }
    85%  { opacity: 1; }
    100% { height: 100%; opacity: 0; }
  }
  @keyframes shimmer-btn {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes glow-input {
    0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
    50%     { box-shadow: 0 0 16px 0 rgba(99,102,241,0.25); }
  }
  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .auth-grid {
    background-image:
      linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .auth-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 13px 16px;
    color: #f1f5f9;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    box-sizing: border-box;
  }
  .auth-input::placeholder { color: #475569; }
  .auth-input:focus {
    border-color: rgba(99,102,241,0.7);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
    background: rgba(99,102,241,0.05);
  }
  .auth-input:hover:not(:focus) { border-color: rgba(255,255,255,0.18); }
  .auth-btn {
    width: 100%;
    padding: 14px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 15px;
    color: #fff;
    cursor: pointer;
    border: none;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%);
    background-size: 200% auto;
    transition: all 0.25s;
    position: relative;
    overflow: hidden;
  }
  .auth-btn:hover:not(:disabled) {
    animation: shimmer-btn 1.5s linear infinite;
    box-shadow: 0 0 32px rgba(99,102,241,0.55), 0 4px 20px rgba(0,0,0,0.3);
    transform: translateY(-1px);
  }
  .auth-btn:active:not(:disabled) { transform: translateY(0); }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%);
    background-size: 200% 100%;
  }
  .node-pulse::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1.5px solid currentColor;
    animation: pulse-ring 2s ease-out infinite;
  }
  .fade-in { animation: fadeSlideUp 0.5s cubic-bezier(.16,1,.3,1) both; }
  .fade-in-1 { animation: fadeSlideUp 0.5s 0.08s cubic-bezier(.16,1,.3,1) both; }
  .fade-in-2 { animation: fadeSlideUp 0.5s 0.16s cubic-bezier(.16,1,.3,1) both; }
  .fade-in-3 { animation: fadeSlideUp 0.5s 0.24s cubic-bezier(.16,1,.3,1) both; }
  .fade-in-4 { animation: fadeSlideUp 0.5s 0.32s cubic-bezier(.16,1,.3,1) both; }
  .fade-in-5 { animation: fadeSlideUp 0.5s 0.40s cubic-bezier(.16,1,.3,1) both; }
`;

/* ─── Left panel shared between login + register ─────── */
function AuthPanel() {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "#07070d", flex: "0 0 52%",
      display: "flex", flexDirection: "column",
      padding: "40px 48px",
    }}>
      {/* Grid */}
      <div className="auth-grid" style={{ position: "absolute", inset: 0 }} />

      {/* Orbs */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: 480, height: 480, background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 65%)", borderRadius: "50%", animation: "orb1 16s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-5%", right: "-10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(34,211,238,0.14) 0%, transparent 65%)", borderRadius: "50%", animation: "orb2 20s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", right: "20%", width: 280, height: 280, background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 65%)", borderRadius: "50%", animation: "orb3 13s ease-in-out infinite", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, marginBottom: "auto" }}>
        <svg viewBox="0 0 32 32" fill="none" width="32" height="32">
          <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z" fill="url(#lg1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <rect x="11" y="10" width="10" height="7" rx="1.5" fill="rgba(255,255,255,0.95)" />
          <rect x="12.5" y="14" width="2" height="2" rx="0.5" fill="#22d3ee" />
          <rect x="15" y="12.5" width="2" height="3.5" rx="0.5" fill="#6366f1" />
          <rect x="17.5" y="13.5" width="2" height="2.5" rx="0.5" fill="#a78bfa" />
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#22d3ee" /><stop offset="1" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
          Chorus <span style={{ color: "#818cf8" }}>Observe</span>
        </span>
      </div>

      {/* Main visual — Trace graph */}
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 32 }}>

        {/* Headline */}
        <div>
          <h2 style={{ fontSize: "clamp(26px,3vw,38px)", fontWeight: 800, letterSpacing: "-0.035em", color: "#f1f5f9", lineHeight: 1.15, marginBottom: 14 }}>
            Every token.<br />
            <span style={{ background: "linear-gradient(90deg,#818cf8,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Every millisecond.
            </span>
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, maxWidth: 380 }}>
            Full-stack observability for LLM agents — from OTLP ingestion
            to production-grade evaluation, alerting, and cost control.
          </p>
        </div>

        {/* Trace visualization */}
        <div style={{ position: "relative", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px 20px", animation: "float 5s ease-in-out infinite" }}>
          <div style={{ position: "absolute", top: 0, left: 24, right: 24, height: 1, background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)" }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            Live Trace — ag_router_v3
          </div>
          {[
            { label: "ag_router_v3", w: "100%", color: "#6366f1", ms: "2 347ms", indent: 0 },
            { label: "└─ LLM · claude-3-5-sonnet", w: "58%", color: "#3b82f6", ms: "1 842ms", indent: 14 },
            { label: "└─ TOOL · brave_search", w: "22%", color: "#34d399", ms: "  412ms", indent: 14 },
            { label: "└─ LLM · claude-3-5-sonnet", w: "74%", color: "#3b82f6", ms: "2 140ms", indent: 14 },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4b5563", paddingLeft: r.indent, flexShrink: 0, width: 190, overflow: "hidden", whiteSpace: "nowrap" }}>{r.label}</span>
              <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: r.w, background: r.color, borderRadius: 4, opacity: 0.75 }} />
              </div>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4b5563", flexShrink: 0, width: 54, textAlign: "right" }}>{r.ms}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { l: "STATUS", v: "SUCCESS", c: "#34d399" },
              { l: "COST", v: "$0.0070", c: "#fbbf24" },
              { l: "TOKENS", v: "2 261", c: "#818cf8" },
            ].map(s => (
              <div key={s.l} style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{s.l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.c, fontFamily: "monospace" }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: "🔭", text: "Full OTLP tracing — LangChain, LangGraph, OpenAI & 44 more" },
            { icon: "💰", text: "Real-time cost attribution per agent, model, and tenant" },
            { icon: "⚖️", text: "LLM-as-judge evals with hallucination scoring built-in" },
          ].map(f => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{f.icon}</span>
              <span style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Floating badge */}
        <div style={{
          position: "absolute", bottom: -10, right: 0,
          background: "rgba(8,8,14,0.95)", border: "1px solid rgba(52,211,153,0.3)",
          borderRadius: 10, padding: "10px 14px",
          animation: "floatB 4s ease-in-out infinite",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399", display: "block", flexShrink: 0 }} />
            <span style={{ color: "#34d399", fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>847 runs/min</span>
          </div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>sustained · 99.9% uptime</div>
        </div>
      </div>

      {/* Trust strip */}
      <div style={{ position: "relative", marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 11, color: "#374151", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Trusted by teams at</div>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          {["Meridian Labs", "Aria Systems", "Flux AI", "Vertex Corp", "NovaSpark"].map(c => (
            <span key={c} style={{ color: "#334155", fontSize: 12, fontWeight: 600 }}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Login form ─────────────────────────────────────────── */
function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") || "/";

  const [tenantId, setTenantId] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("chorus_tenant_id") ?? "") : ""
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Workspace lookup state
  const [showLookup, setShowLookup] = useState(false);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(tenantId, email, password);
      router.push(redirectTo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      setError(
        msg.includes("429") || msg.toLowerCase().includes("locked")
          ? "Account temporarily locked — too many failed attempts. Try again later."
          : "Invalid workspace ID, email, or password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError("");
    setLookupLoading(true);
    try {
      await fetch("/api/auth/workspace-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lookupEmail }),
      });
      setLookupDone(true);
    } catch {
      setLookupError("Request failed — please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div style={{
      background: "#07070d", minHeight: "100vh",
      display: "flex", overflow: "hidden",
    }}>
      <style>{CSS}</style>
      <AuthPanel />

      {/* Right — form panel */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 32px",
        background: "rgba(255,255,255,0.015)",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Header */}
          <div className="fade-in" style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em", marginBottom: 8 }}>
              Welcome back
            </h1>
            <p style={{ color: "#64748b", fontSize: 14 }}>
              Sign in to your Chorus workspace
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="fade-in" style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 20,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Tenant ID */}
            <div className="fade-in-1" style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Workspace ID
              </label>
              <input
                className="auth-input"
                type="text"
                placeholder="tnt-your-workspace"
                value={tenantId}
                onChange={e => setTenantId(e.target.value)}
                autoComplete="organization"
                required
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5 }}>
                <p style={{ fontSize: 11, color: "#374151", margin: 0 }}>
                  Provided when your workspace was created
                </p>
                <button
                  type="button"
                  onClick={() => { setShowLookup(v => !v); setLookupDone(false); setLookupError(""); }}
                  style={{ fontSize: 11, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                >
                  Forgot it?
                </button>
              </div>

              {showLookup && (
                <div style={{
                  marginTop: 12, padding: "14px 16px", borderRadius: 10,
                  background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)",
                }}>
                  {lookupDone ? (
                    <p style={{ fontSize: 13, color: "#a5b4fc", margin: 0 }}>
                      ✓ Check your inbox — we sent your workspace ID to that address if an account exists.
                    </p>
                  ) : (
                    <form onSubmit={handleLookup}>
                      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                        Enter your email and we'll send your workspace ID to your inbox.
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          className="auth-input"
                          type="email"
                          placeholder="you@company.com"
                          value={lookupEmail}
                          onChange={e => setLookupEmail(e.target.value)}
                          required
                          style={{ flex: 1, padding: "10px 12px", fontSize: 13 }}
                        />
                        <button
                          type="submit"
                          disabled={lookupLoading}
                          style={{
                            padding: "10px 16px", borderRadius: 8, border: "none",
                            background: "#4f46e5", color: "#fff", fontSize: 13, fontWeight: 600,
                            cursor: lookupLoading ? "not-allowed" : "pointer", opacity: lookupLoading ? 0.6 : 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {lookupLoading ? "Sending…" : "Send"}
                        </button>
                      </div>
                      {lookupError && <p style={{ fontSize: 12, color: "#fca5a5", marginTop: 6 }}>{lookupError}</p>}
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="fade-in-2" style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Email
              </label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className="fade-in-3" style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Password
                </label>
                <Link href="#" style={{ fontSize: 12, color: "#6366f1", fontWeight: 500, transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#6366f1")}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  className="auth-input"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    color: "#475569", background: "none", border: "none", cursor: "pointer", padding: 0,
                    transition: "color 0.15s", display: "flex",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw
                    ? <EyeOff size={16} />
                    : <Eye size={16} />
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="fade-in-4" style={{ marginTop: 28 }}>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading
                  ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Signing in…
                    </span>
                  : "Sign in to Chorus"
                }
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="fade-in-4" style={{ display: "flex", alignItems: "center", gap: 14, margin: "28px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            <span style={{ color: "#374151", fontSize: 12 }}>or continue with SSO</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* SSO button */}
          <div className="fade-in-4">
            <button style={{
              width: "100%", padding: "13px", borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Continue with SAML / OIDC
            </button>
          </div>

          {/* Footer */}
          <div className="fade-in-5" style={{ textAlign: "center", marginTop: 32 }}>
            <span style={{ fontSize: 14, color: "#374151" }}>
              No account yet?{" "}
              <Link href="/register" style={{ color: "#818cf8", fontWeight: 600, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#a5b4fc")}
                onMouseLeave={e => (e.currentTarget.style.color = "#818cf8")}
              >
                Create workspace →
              </Link>
            </span>
          </div>

          {/* Security note */}
          <div className="fade-in-5" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 24 }}>
            <span style={{ fontSize: 11, color: "#1e293b" }}>🔒</span>
            <span style={{ fontSize: 11, color: "#1e293b" }}>Protected by httpOnly JWT · SOC 2 Type II</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
