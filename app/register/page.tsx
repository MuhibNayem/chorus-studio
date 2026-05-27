"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

/* ─── Shared CSS (identical to login) ──────────────────── */
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
  @keyframes float  { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes floatB { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes shimmer-btn {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
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
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .fade-in   { animation: fadeSlideUp 0.5s cubic-bezier(.16,1,.3,1) both; }
  .fade-in-1 { animation: fadeSlideUp 0.5s 0.06s cubic-bezier(.16,1,.3,1) both; }
  .fade-in-2 { animation: fadeSlideUp 0.5s 0.12s cubic-bezier(.16,1,.3,1) both; }
  .fade-in-3 { animation: fadeSlideUp 0.5s 0.18s cubic-bezier(.16,1,.3,1) both; }
  .fade-in-4 { animation: fadeSlideUp 0.5s 0.24s cubic-bezier(.16,1,.3,1) both; }
  .fade-in-5 { animation: fadeSlideUp 0.5s 0.30s cubic-bezier(.16,1,.3,1) both; }
  .fade-in-6 { animation: fadeSlideUp 0.5s 0.36s cubic-bezier(.16,1,.3,1) both; }
`;

/* ─── Password strength ─────────────────────────────────── */
function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "#1e293b" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
  if (score === 2) return { score: 2, label: "Fair", color: "#f97316" };
  if (score === 3) return { score: 3, label: "Good", color: "#eab308" };
  return { score: 4, label: "Strong", color: "#22c55e" };
}

/* ─── Left panel ────────────────────────────────────────── */
function AuthPanel() {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "#07070d", flex: "0 0 52%",
      display: "flex", flexDirection: "column",
      padding: "40px 48px",
    }}>
      <div className="auth-grid" style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: 480, height: 480, background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 65%)", borderRadius: "50%", animation: "orb1 16s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-5%", right: "-10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(34,211,238,0.14) 0%, transparent 65%)", borderRadius: "50%", animation: "orb2 20s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", right: "20%", width: 280, height: 280, background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 65%)", borderRadius: "50%", animation: "orb3 13s ease-in-out infinite", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, marginBottom: "auto" }}>
        <svg viewBox="0 0 32 32" fill="none" width="32" height="32">
          <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z" fill="url(#rg1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <rect x="11" y="10" width="10" height="7" rx="1.5" fill="rgba(255,255,255,0.95)" />
          <rect x="12.5" y="14" width="2" height="2" rx="0.5" fill="#22d3ee" />
          <rect x="15" y="12.5" width="2" height="3.5" rx="0.5" fill="#6366f1" />
          <rect x="17.5" y="13.5" width="2" height="2.5" rx="0.5" fill="#a78bfa" />
          <defs>
            <linearGradient id="rg1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#22d3ee" /><stop offset="1" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
          Chorus <span style={{ color: "#818cf8" }}>Observe</span>
        </span>
      </div>

      {/* Content */}
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 32 }}>
        <div>
          <h2 style={{ fontSize: "clamp(26px,3vw,38px)", fontWeight: 800, letterSpacing: "-0.035em", color: "#f1f5f9", lineHeight: 1.15, marginBottom: 14 }}>
            Your AI ops<br />
            <span style={{ background: "linear-gradient(90deg,#818cf8,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              command centre.
            </span>
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, maxWidth: 380 }}>
            Set up your workspace in 60 seconds. Your first trace will appear
            in the dashboard before you finish your coffee.
          </p>
        </div>

        {/* Onboarding steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { step: "01", title: "Create your workspace", desc: "One account, unlimited agents and models" },
            { step: "02", title: "Point your OTLP endpoint", desc: "One env var. Zero code changes." },
            { step: "03", title: "See traces in real time", desc: "Full waterfall, cost, latency — instantly" },
          ].map((s, i) => (
            <div key={s.step} style={{ display: "flex", gap: 16, position: "relative", paddingBottom: i < 2 ? 24 : 0 }}>
              {i < 2 && (
                <div style={{ position: "absolute", left: 16, top: 32, bottom: 0, width: 1, background: "rgba(99,102,241,0.2)" }} />
              )}
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "#818cf8",
              }}>{s.step}</div>
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#e2e8f0", marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "#475569" }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* What you get */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14, padding: "20px", animation: "float 6s ease-in-out infinite",
        }}>
          <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Free plan includes
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              "100k traces/month", "7-day retention",
              "Full OTLP tracing", "Cost dashboards",
              "LLM eval engine", "Community support",
            ].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: "#34d399", fontSize: 12 }}>✓</span>
                <span style={{ color: "#64748b", fontSize: 13 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating badge */}
        <div style={{
          position: "absolute", bottom: -10, right: 0,
          background: "rgba(8,8,14,0.95)", border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: 10, padding: "10px 14px",
          animation: "floatB 4s ease-in-out infinite",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          <div style={{ color: "#818cf8", fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>No credit card</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>free forever · upgrade anytime</div>
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

/* ─── Register page ─────────────────────────────────────── */
function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

export default function RegisterPage() {
  const { register, isAuthenticated, user } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [newTenantId, setNewTenantId] = useState("");
  const [copied, setCopied] = useState(false);

  if (isAuthenticated && !registered) {
    router.push("/");
    return null;
  }

  const { score, label, color } = passwordStrength(password);
  const pwMatch = confirmPassword.length > 0 && password === confirmPassword;
  const pwMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await register(email, password, displayName);
      // user is now set in AuthContext — grab tenantId from the response
      const tid = typeof window !== "undefined"
        ? (localStorage.getItem("chorus_tenant_id") ?? "")
        : "";
      setNewTenantId(tid);
      setRegistered(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg.includes("409") || msg.toLowerCase().includes("already")
        ? "An account with this email already exists."
        : msg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div style={{ background: "#07070d", minHeight: "100vh", display: "flex", overflow: "hidden" }}>
        <style>{CSS}</style>
        <AuthPanel />
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "40px 32px", background: "rgba(255,255,255,0.015)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ width: "100%", maxWidth: 400 }} className="fade-in">
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%", margin: "0 auto 20px",
                background: "rgba(34,197,94,0.12)", border: "1.5px solid rgba(34,197,94,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
              }}>✓</div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em", marginBottom: 8 }}>
                Workspace created!
              </h1>
              <p style={{ color: "#64748b", fontSize: 14 }}>
                Save your Workspace ID — you'll need it every time you sign in.
              </p>
            </div>

            <div style={{
              padding: "20px", borderRadius: 12, marginBottom: 24,
              background: "rgba(99,102,241,0.06)", border: "1.5px solid rgba(99,102,241,0.3)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Your Workspace ID
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <code style={{
                  flex: 1, fontSize: 15, fontWeight: 700, color: "#e2e8f0",
                  fontFamily: "monospace", wordBreak: "break-all",
                }}>{newTenantId || user?.tenantId}</code>
                <button
                  onClick={() => copyToClipboard(newTenantId || user?.tenantId || "", setCopied)}
                  style={{
                    flexShrink: 0, padding: "8px 14px", borderRadius: 8,
                    background: copied ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.15)",
                    border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(99,102,241,0.3)"}`,
                    color: copied ? "#86efac" : "#a5b4fc",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div style={{
              padding: "14px 16px", borderRadius: 10, marginBottom: 28,
              background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
              <p style={{ fontSize: 12, color: "#fde68a", margin: 0, lineHeight: 1.6 }}>
                This ID won't be shown again. If you forget it, use the{" "}
                <strong>"Forgot it?"</strong> link on the sign-in page and we'll email it to you.
              </p>
            </div>

            <button
              onClick={() => router.push("/")}
              className="auth-btn"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#07070d", minHeight: "100vh", display: "flex", overflow: "hidden" }}>
      <style>{CSS}</style>
      <AuthPanel />

      {/* Right — form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 32px",
        background: "rgba(255,255,255,0.015)",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 400, paddingBottom: 24 }}>

          {/* Header */}
          <div className="fade-in" style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em", marginBottom: 8 }}>
              Create your workspace
            </h1>
            <p style={{ color: "#64748b", fontSize: 14 }}>
              Your team's AI observability starts here
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
            {/* Full name */}
            <div className="fade-in-1" style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Full Name
              </label>
              <input
                className="auth-input"
                type="text"
                placeholder="Jane Doe"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            {/* Email */}
            <div className="fade-in-2" style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Work Email
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
            <div className="fade-in-3" style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="auth-input"
                  type={showPw ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
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
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength meter */}
              {password.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: score >= n ? color : "rgba(255,255,255,0.08)",
                        transition: "background 0.3s",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: color, fontWeight: 600 }}>
                    {label} password
                    {score < 3 && <span style={{ color: "#374151", fontWeight: 400 }}> — add uppercase, numbers, or symbols</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="fade-in-4" style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Confirm Password
              </label>
              <input
                className="auth-input"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                style={{
                  borderColor: pwMismatch
                    ? "rgba(239,68,68,0.5)"
                    : pwMatch
                    ? "rgba(34,197,94,0.5)"
                    : undefined,
                }}
              />
              {pwMatch && (
                <div style={{ fontSize: 11, color: "#22c55e", marginTop: 5, fontWeight: 500 }}>✓ Passwords match</div>
              )}
              {pwMismatch && (
                <div style={{ fontSize: 11, color: "#ef4444", marginTop: 5 }}>Passwords do not match</div>
              )}
            </div>

            {/* Terms */}
            <div className="fade-in-4" style={{ marginBottom: 24, marginTop: 16 }}>
              <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
                By creating an account you agree to our{" "}
                <a href="#" style={{ color: "#6366f1", fontWeight: 500 }}>Terms of Service</a>
                {" "}and{" "}
                <a href="#" style={{ color: "#6366f1", fontWeight: 500 }}>Privacy Policy</a>.
              </p>
            </div>

            {/* Submit */}
            <div className="fade-in-5">
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading
                  ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Creating workspace…
                    </span>
                  : "Create Free Workspace →"
                }
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="fade-in-6" style={{ textAlign: "center", marginTop: 28 }}>
            <span style={{ fontSize: 14, color: "#374151" }}>
              Already have a workspace?{" "}
              <Link href="/login" style={{ color: "#818cf8", fontWeight: 600, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#a5b4fc")}
                onMouseLeave={e => (e.currentTarget.style.color = "#818cf8")}
              >
                Sign in →
              </Link>
            </span>
          </div>

          <div className="fade-in-6" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20 }}>
            <span style={{ fontSize: 11, color: "#1e293b" }}>🔒</span>
            <span style={{ fontSize: 11, color: "#1e293b" }}>Protected by httpOnly JWT · SOC 2 Type II</span>
          </div>
        </div>
      </div>
    </div>
  );
}
