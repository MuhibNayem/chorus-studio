"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─── Inline styles for animations not expressible in Tailwind ─── */
const GLOBAL_CSS = `
  @keyframes drift {
    0%   { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(60px, -40px) scale(1.08); }
    66%  { transform: translate(-40px, 60px) scale(0.94); }
    100% { transform: translate(0, 0) scale(1); }
  }
  @keyframes drift2 {
    0%   { transform: translate(0, 0) scale(1); }
    40%  { transform: translate(-80px, 50px) scale(1.12); }
    70%  { transform: translate(50px, -30px) scale(0.9); }
    100% { transform: translate(0, 0) scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 20px 0 rgba(99,102,241,0.3), 0 0 60px 0 rgba(99,102,241,0.08); }
    50%       { box-shadow: 0 0 30px 6px rgba(99,102,241,0.5), 0 0 80px 0 rgba(99,102,241,0.15); }
  }
  @keyframes beam {
    0%   { width: 0; opacity: 0; }
    10%  { opacity: 1; }
    80%  { opacity: 1; }
    100% { width: 100%; opacity: 0; }
  }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes scanline {
    0%   { top: 0%; }
    100% { top: 100%; }
  }
  @keyframes float-badge {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }
  .anim-fadeup   { animation: fadeUp 0.7s cubic-bezier(.16,1,.3,1) both; }
  .anim-fadeup-1 { animation: fadeUp 0.7s 0.10s cubic-bezier(.16,1,.3,1) both; }
  .anim-fadeup-2 { animation: fadeUp 0.7s 0.20s cubic-bezier(.16,1,.3,1) both; }
  .anim-fadeup-3 { animation: fadeUp 0.7s 0.32s cubic-bezier(.16,1,.3,1) both; }
  .anim-fadeup-4 { animation: fadeUp 0.7s 0.44s cubic-bezier(.16,1,.3,1) both; }
  .cursor-blink  { animation: blink 1s step-end infinite; }
  .grid-bg {
    background-image:
      linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
    background-size: 60px 60px;
  }
  .card-glow:hover {
    box-shadow: 0 0 0 1px rgba(99,102,241,0.4), 0 8px 40px rgba(99,102,241,0.12);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
    transform: translateY(-2px);
  }
  .card-glow { transition: box-shadow 0.3s ease, transform 0.3s ease; }
  .shimmer-text {
    background: linear-gradient(90deg,
      #c4b5fd 0%, #818cf8 20%, #22d3ee 40%, #818cf8 60%, #c4b5fd 80%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }
  .nav-blur {
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
  }
`;

/* ─── Terminal lines that animate in ─── */
const TERMINAL_LINES = [
  { delay: 0,    color: "#6b7280", text: "$ chorus trace init --otlp grpc://localhost:4317" },
  { delay: 900,  color: "#22d3ee", text: "✓ OTLP collector ready — 4317/tcp" },
  { delay: 1600, color: "#6b7280", text: "> run ag_router_v3  model=claude-3-5-sonnet" },
  { delay: 2300, color: "#818cf8", text: "  [LLM]  prompt_tokens=1 842  cost=$0.0041  14 ms" },
  { delay: 2900, color: "#818cf8", text: "  [TOOL] brave_search  → 3 results  112 ms" },
  { delay: 3500, color: "#818cf8", text: "  [LLM]  completion_tokens=419  cost=$0.0029  2.1 s" },
  { delay: 4200, color: "#34d399", text: "✓ run complete  total=2.3 s  cost=$0.0070  status=SUCCESS" },
  { delay: 5000, color: "#6b7280", text: "> chorus eval run --evaluator hallucination_scorer" },
  { delay: 5700, color: "#fbbf24", text: "  score=0.96  threshold=0.90  ⚠ 1 span flagged" },
  { delay: 6400, color: "#34d399", text: "✓ eval complete — view in Chorus Studio →" },
];

function Terminal() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = TERMINAL_LINES.map((_, i) =>
      setTimeout(() => setVisibleLines(i + 1), TERMINAL_LINES[i].delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      style={{
        background: "rgba(8,8,14,0.95)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 12,
        lineHeight: 1.7,
        boxShadow: "0 0 0 1px rgba(99,102,241,0.1), 0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.08)",
      }}
    >
      {/* Window chrome */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e", display: "block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28ca41", display: "block" }} />
        <span style={{ flex: 1, textAlign: "center", color: "#4b5563", fontSize: 11 }}>chorus-studio — trace</span>
      </div>
      {/* Content */}
      <div style={{ padding: "18px 20px", minHeight: 260 }}>
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} style={{ color: line.color, marginBottom: 2, opacity: 1 }}>
            {line.text}
          </div>
        ))}
        {visibleLines < TERMINAL_LINES.length && (
          <span style={{ color: "#6366f1" }} className="cursor-blink">█</span>
        )}
      </div>
    </div>
  );
}

/* ─── Animated counter ─── */
function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const duration = 1800;
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        setVal(Math.round(ease * to));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);

  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ─── Feature card ─── */
function FeatureCard({
  icon, title, desc, accent = "#6366f1", large = false, badge
}: {
  icon: string; title: string; desc: string; accent?: string; large?: boolean; badge?: string
}) {
  return (
    <div
      className="card-glow"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: large ? "32px" : "24px",
        position: "relative",
        overflow: "hidden",
        gridColumn: large ? "span 2" : undefined,
      }}
    >
      {/* top-left accent line */}
      <div style={{
        position: "absolute", top: 0, left: 24, right: 24, height: 1,
        background: `linear-gradient(90deg, transparent, ${accent}66, transparent)`,
      }} />
      {badge && (
        <span style={{
          position: "absolute", top: 16, right: 16,
          background: `${accent}22`,
          color: accent,
          border: `1px solid ${accent}44`,
          borderRadius: 999, padding: "2px 10px", fontSize: 10, fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>{badge}</span>
      )}
      <div style={{ fontSize: 28, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10, color: "#f1f5f9" }}>{title}</div>
      <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7 }}>{desc}</div>
    </div>
  );
}

/* ─── Integration pill ─── */
function IntegrationPill({ name, color }: { name: string; color: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 999, padding: "8px 18px",
      color: "#cbd5e1", fontSize: 13, fontWeight: 500,
      transition: "all 0.2s",
    }}
      className="card-glow"
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0, boxShadow: `0 0 8px ${color}` }} />
      {name}
    </div>
  );
}

/* ─── Main page ─── */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ background: "#07070d", minHeight: "100vh", color: "#f1f5f9", overflowX: "hidden" }}>

        {/* ══ NAV ══════════════════════════════════════════════════════════ */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(7,7,13,0.8)",
        }} className="nav-blur">
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
                <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z" fill="url(#navGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <rect x="11" y="10" width="10" height="7" rx="1.5" fill="rgba(255,255,255,0.95)" />
                <rect x="12.5" y="14" width="2" height="2" rx="0.5" fill="#22d3ee" />
                <rect x="15" y="12.5" width="2" height="3.5" rx="0.5" fill="#6366f1" />
                <rect x="17.5" y="13.5" width="2" height="2.5" rx="0.5" fill="#a78bfa" />
                <defs>
                  <linearGradient id="navGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#22d3ee" />
                    <stop offset="1" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>
                Chorus <span style={{ color: "#6366f1" }}>Observe</span>
              </span>
            </div>

            {/* Desktop links */}
            <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden md:flex">
              {["Features", "Integrations", "Enterprise", "Pricing", "Docs"].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500, transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#f1f5f9")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
                >{l}</a>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/login" style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500, padding: "8px 16px", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f1f5f9")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
              >Sign in</Link>
              <Link href="/register" style={{
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                color: "#fff", fontWeight: 600, fontSize: 14,
                padding: "8px 20px", borderRadius: 8,
                boxShadow: "0 0 20px rgba(99,102,241,0.4)",
                transition: "box-shadow 0.2s, transform 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 30px rgba(99,102,241,0.6)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 20px rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >Start Free</Link>
            </div>
          </div>
        </nav>

        {/* ══ HERO ═════════════════════════════════════════════════════════ */}
        <section style={{ position: "relative", paddingTop: 140, paddingBottom: 80, minHeight: "100vh", display: "flex", alignItems: "center" }}>
          {/* Grid bg */}
          <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 1 }} />

          {/* Orbs */}
          <div style={{
            position: "absolute", top: "10%", left: "5%", width: 600, height: 600,
            background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
            borderRadius: "50%", animation: "drift 14s ease-in-out infinite", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", top: "20%", right: "-5%", width: 500, height: 500,
            background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)",
            borderRadius: "50%", animation: "drift2 18s ease-in-out infinite", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "5%", left: "35%", width: 400, height: 400,
            background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)",
            borderRadius: "50%", animation: "drift 22s ease-in-out infinite", pointerEvents: "none",
          }} />

          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", position: "relative", width: "100%" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
              {/* Left */}
              <div>
                <div className="anim-fadeup" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: 999, padding: "6px 16px", marginBottom: 28,
                  animation: "float-badge 3s ease-in-out infinite",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399", display: "block" }} />
                  <span style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Enterprise LLM Observability — GA
                  </span>
                </div>

                <h1 className="anim-fadeup-1" style={{
                  fontSize: "clamp(38px, 5vw, 62px)", fontWeight: 800,
                  lineHeight: 1.08, letterSpacing: "-0.035em", marginBottom: 24, margin: 0,
                }}>
                  <span style={{ color: "#f1f5f9" }}>See Every Token.</span>
                  <br />
                  <span className="shimmer-text">Ship With Confidence.</span>
                </h1>

                <p className="anim-fadeup-2" style={{
                  color: "#94a3b8", fontSize: 18, lineHeight: 1.75, marginTop: 24, marginBottom: 36, maxWidth: 520,
                }}>
                  Chorus Observe gives AI teams full-stack visibility into LLM runs, agent traces,
                  costs, and quality — from a single OTLP endpoint to a production-grade observability
                  platform your whole org can trust.
                </p>

                <div className="anim-fadeup-3" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Link href="/register" style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: "#fff", fontWeight: 700, fontSize: 15,
                    padding: "14px 28px", borderRadius: 10,
                    boxShadow: "0 0 30px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
                    transition: "all 0.25s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 50px rgba(99,102,241,0.7), inset 0 1px 0 rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 30px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0) scale(1)"; }}
                  >
                    Start for Free
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" /></svg>
                  </Link>

                  <a href="#features" style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                    color: "#cbd5e1", fontWeight: 600, fontSize: 15,
                    padding: "14px 28px", borderRadius: 10,
                    transition: "all 0.25s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" /></svg>
                    See Live Demo
                  </a>
                </div>

                <div className="anim-fadeup-4" style={{ display: "flex", gap: 24, marginTop: 40, flexWrap: "wrap" }}>
                  {[
                    { val: "< 1 min", lbl: "to first trace" },
                    { val: "SOC 2", lbl: "Type II ready" },
                    { val: "Open Core", lbl: "no vendor lock-in" },
                  ].map(s => (
                    <div key={s.lbl} style={{ borderLeft: "2px solid rgba(99,102,241,0.4)", paddingLeft: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "#e2e8f0" }}>{s.val}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Terminal */}
              <div className="anim-fadeup-2" style={{ position: "relative" }}>
                <Terminal />
                {/* Floating stat badge */}
                <div style={{
                  position: "absolute", bottom: -20, left: -20,
                  background: "rgba(8,8,14,0.95)", border: "1px solid rgba(52,211,153,0.3)",
                  borderRadius: 12, padding: "12px 18px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
                  animation: "float-badge 4s ease-in-out infinite",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 10px #34d399", display: "block" }} />
                    <span style={{ color: "#34d399", fontWeight: 700, fontSize: 14 }}>847 runs/min</span>
                  </div>
                  <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>sustained throughput</div>
                </div>
                <div style={{
                  position: "absolute", top: -20, right: -20,
                  background: "rgba(8,8,14,0.95)", border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: 12, padding: "12px 18px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
                  animation: "float-badge 3.5s 1s ease-in-out infinite",
                }}>
                  <div style={{ color: "#818cf8", fontWeight: 700, fontSize: 14 }}>$0.0070 / run</div>
                  <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>real-time cost tracking</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ METRICS STRIP ════════════════════════════════════════════════ */}
        <section style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
          padding: "48px 0",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
              {[
                { val: 2400000000, suffix: "+", prefix: "", label: "Traces Ingested", color: "#818cf8" },
                { val: 99, suffix: ".9%", prefix: "", label: "Platform Uptime SLA", color: "#34d399" },
                { val: 3, suffix: "ms", prefix: "<", label: "p99 Ingest Latency", color: "#22d3ee" },
                { val: 47, suffix: "+", prefix: "", label: "Framework Integrations", color: "#fbbf24" },
              ].map((s, i) => (
                <div key={s.label} style={{
                  textAlign: "center", padding: "24px 16px",
                  borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                }}>
                  <div style={{ fontWeight: 800, fontSize: 40, letterSpacing: "-0.04em", color: s.color }}>
                    <Counter to={s.val} suffix={s.suffix} prefix={s.prefix} />
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 6, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TICKER ═══════════════════════════════════════════════════════ */}
        <div style={{ overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "14px 0", background: "rgba(99,102,241,0.04)" }}>
          <div style={{ display: "flex", gap: 48, animation: "ticker 30s linear infinite", width: "max-content" }}>
            {Array.from({ length: 2 }).flatMap(() => [
              "LangChain", "LangGraph", "OpenAI SDK", "Anthropic SDK", "LlamaIndex",
              "CrewAI", "AutoGen", "Semantic Kernel", "Haystack", "DSPy",
              "Vercel AI SDK", "Google AI", "Groq", "Mistral", "Cohere", "Ollama",
            ].map(name => (
              <span key={name + Math.random()} style={{ color: "#475569", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>
                ◆ {name}
              </span>
            )))}
          </div>
        </div>

        {/* ══ FEATURES ═════════════════════════════════════════════════════ */}
        <section id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{
              display: "inline-block", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: 999, padding: "5px 16px", marginBottom: 20, color: "#818cf8", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>Platform Capabilities</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", marginBottom: 16 }}>
              Observability that goes the<br />
              <span className="shimmer-text">full depth of your AI stack</span>
            </h2>
            <p style={{ color: "#64748b", fontSize: 17, maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
              From OTLP ingestion to LLM-as-judge evaluation, Chorus Observe covers
              every layer your team needs to ship reliable, cost-efficient AI products.
            </p>
          </div>

          {/* Bento grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {/* Large card */}
            <div className="card-glow" style={{
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: 36, gridColumn: "span 2", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 24, right: 24, height: 1, background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)" }} />
              <div style={{ position: "absolute", bottom: -60, right: -40, width: 260, height: 260, background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ fontSize: 32, marginBottom: 18 }}>🔭</div>
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 12, color: "#f1f5f9" }}>Full-Stack Agent Tracing</div>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.75, maxWidth: 440, marginBottom: 24 }}>
                Capture every LLM call, tool invocation, RAG retrieval, and agent sub-call in a
                waterfall trace. Automatic OTLP ingestion over gRPC or HTTP — zero instrumentation
                boilerplate, full span context propagation.
              </p>
              {/* Mini waterfall visualization */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "ag_router_v3", width: "100%", color: "#6366f1", ms: "2 347ms" },
                  { label: "  ├─ [LLM] claude-3-5-sonnet", width: "55%", color: "#3b82f6", ms: "1 842ms" },
                  { label: "  ├─ [TOOL] brave_search", width: "20%", color: "#34d399", ms: "  419ms" },
                  { label: "  └─ [LLM] claude-3-5-sonnet", width: "70%", color: "#3b82f6", ms: "2 140ms" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b", width: 220, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden" }}>{row.label}</span>
                    <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: row.width, background: row.color, borderRadius: 4, opacity: 0.7 }} />
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b", width: 60, textAlign: "right", flexShrink: 0 }}>{row.ms}</span>
                  </div>
                ))}
              </div>
            </div>

            <FeatureCard
              icon="⚖️"
              title="LLM-as-Judge Evaluation"
              desc="Run hallucination scoring, coherence checks, and custom LLM-judge rubrics against any run. N-gram baseline + neural judge, with per-span scoring and dataset-level rollups."
              accent="#818cf8"
              badge="Built-in"
            />

            <FeatureCard
              icon="💰"
              title="Real-Time Cost Intelligence"
              desc="Per-token, per-model, per-agent cost attribution with dynamic pricing from 200+ model providers. Set budgets, get alerts before you overrun."
              accent="#fbbf24"
            />

            <FeatureCard
              icon="🔴"
              title="Red Team Suite"
              desc="Automated adversarial testing with scenario libraries. Run jailbreak, prompt-injection, and policy-violation campaigns. Integrates with your guardrail engine."
              accent="#f87171"
              badge="Enterprise"
            />

            <FeatureCard
              icon="🧪"
              title="Prompt A/B Testing"
              desc="Version, tag, and A/B test prompts against your real dataset. Statistical significance tracking, cost-aware winner selection, and one-click promotion to production."
              accent="#34d399"
            />

            <FeatureCard
              icon="⏱️"
              title="Time-Travel Debugging"
              desc="Checkpoint any agent run, replay it with a different model or prompt, and diff the outputs. Find exactly where your agent went wrong, then fix it fast."
              accent="#22d3ee"
            />

            <FeatureCard
              icon="🗂️"
              title="Dataset Registry"
              desc="Curate golden datasets from production traces with one click. Use them for eval runs, regression suites, and fine-tuning pipelines."
              accent="#a78bfa"
            />

            {/* Large card #2 */}
            <div className="card-glow" style={{
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: 36, gridColumn: "span 2", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 24, right: 24, height: 1, background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)" }} />
              <div style={{ fontSize: 32, marginBottom: 18 }}>📊</div>
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 12, color: "#f1f5f9" }}>Custom Dashboards & Alerts</div>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.75, marginBottom: 24, maxWidth: 440 }}>
                Build drag-and-drop dashboards from 30+ widget types. Alert on p95 latency spikes, cost
                thresholds, error-rate regressions, or any custom metric. Route to Slack, PagerDuty,
                email, or webhooks.
              </p>
              {/* Mini metrics grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { label: "Runs (24h)", val: "128.4k", delta: "+12%", color: "#6366f1" },
                  { label: "Avg Cost", val: "$0.0082", delta: "-3%", color: "#fbbf24" },
                  { label: "p95 Latency", val: "2.3s", delta: "+0.1s", color: "#22d3ee" },
                  { label: "Error Rate", val: "0.42%", delta: "-18%", color: "#34d399" },
                ].map(m => (
                  <div key={m.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ color: "#64748b", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{m.label}</div>
                    <div style={{ color: m.color, fontWeight: 700, fontSize: 20, fontFamily: "monospace" }}>{m.val}</div>
                    <div style={{ color: m.delta.startsWith("-") ? "#34d399" : "#f87171", fontSize: 11, marginTop: 4 }}>{m.delta}</div>
                  </div>
                ))}
              </div>
            </div>

            <FeatureCard
              icon="🔍"
              title="RAG Observability"
              desc="Trace retrieval queries, chunk rankings, re-ranker scores, and context injection. Identify where your retrieval pipeline loses relevance."
              accent="#a78bfa"
            />
          </div>
        </section>

        {/* ══ HOW IT WORKS ════════════════════════════════════════════════ */}
        <section style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "100px 0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <div style={{ display: "inline-block", background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.25)", borderRadius: 999, padding: "5px 16px", marginBottom: 20, color: "#22d3ee", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Dead Simple Onboarding
              </div>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9" }}>
                From zero to full observability<br />in under 5 minutes
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, position: "relative" }}>
              {/* Connector line */}
              <div style={{ position: "absolute", top: 44, left: "17%", right: "17%", height: 1, background: "linear-gradient(90deg, rgba(99,102,241,0.4), rgba(34,211,238,0.4))", zIndex: 0 }} />

              {[
                {
                  step: "01",
                  title: "Point your OTLP endpoint",
                  desc: "Add one environment variable. Chorus Observe auto-discovers spans from any OTLP-compatible framework — LangChain, LangGraph, Vercel AI SDK, raw OpenAI SDK. Zero code changes.",
                  code: `CHORUS_OTLP_ENDPOINT=\n  grpc://observe.yourco.io:4317`,
                  color: "#6366f1",
                },
                {
                  step: "02",
                  title: "Traces flow in automatically",
                  desc: "Every LLM call, tool use, agent sub-call, and RAG retrieval is captured with full context — model, tokens, cost, latency, errors. Correlated across distributed services.",
                  code: `✓ 2 847 spans ingested\n  p99 ingest: 2.1ms`,
                  color: "#22d3ee",
                },
                {
                  step: "03",
                  title: "Debug, evaluate, optimize",
                  desc: "Use the Studio to explore waterfall traces, run evals against golden datasets, set cost budgets, A/B test prompts, and ship with confidence.",
                  code: `score=0.96  cost=$0.007\n  ✓ ready to ship`,
                  color: "#34d399",
                },
              ].map((s, i) => (
                <div key={s.step} style={{ position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: `${s.color}22`, border: `1px solid ${s.color}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 14, color: s.color, marginBottom: 24,
                    boxShadow: `0 0 20px ${s.color}33`,
                  }}>{s.step}</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#f1f5f9", marginBottom: 12 }}>{s.title}</div>
                  <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{s.desc}</p>
                  <div style={{
                    background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 8, padding: "12px 16px", fontFamily: "monospace", fontSize: 12,
                    color: s.color, whiteSpace: "pre",
                  }}>{s.code}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ INTEGRATIONS ════════════════════════════════════════════════ */}
        <section id="integrations" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-block", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 999, padding: "5px 16px", marginBottom: 20, color: "#a78bfa", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Ecosystem
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", marginBottom: 12 }}>
              Works with every framework you already use
            </h2>
            <p style={{ color: "#64748b", fontSize: 16 }}>Any OTLP-compatible framework works out of the box. Native SDKs for the most popular.</p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {[
              { name: "OpenAI SDK", color: "#34d399" },
              { name: "Anthropic SDK", color: "#f97316" },
              { name: "LangChain", color: "#22d3ee" },
              { name: "LangGraph", color: "#6366f1" },
              { name: "LlamaIndex", color: "#f59e0b" },
              { name: "CrewAI", color: "#ec4899" },
              { name: "AutoGen", color: "#3b82f6" },
              { name: "Semantic Kernel", color: "#8b5cf6" },
              { name: "Haystack", color: "#14b8a6" },
              { name: "DSPy", color: "#f87171" },
              { name: "Vercel AI SDK", color: "#f1f5f9" },
              { name: "Google Gemini", color: "#4285f4" },
              { name: "Groq", color: "#ef4444" },
              { name: "Mistral AI", color: "#ff7000" },
              { name: "Cohere", color: "#39d353" },
              { name: "Ollama", color: "#94a3b8" },
              { name: "Together AI", color: "#a855f7" },
              { name: "Bedrock", color: "#ff9900" },
            ].map(i => <IntegrationPill key={i.name} {...i} />)}
          </div>

          <p style={{ textAlign: "center", color: "#475569", fontSize: 13, marginTop: 28 }}>
            Any OTLP exporter works — Python, TypeScript, Go, Java, Rust. 47+ validated integrations and growing.
          </p>
        </section>

        {/* ══ ENTERPRISE ══════════════════════════════════════════════════ */}
        <section id="enterprise" style={{
          background: "rgba(255,255,255,0.015)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "100px 0",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-block", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 999, padding: "5px 16px", marginBottom: 24, color: "#f87171", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Enterprise-Grade
                </div>
                <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", marginBottom: 20 }}>
                  Security and compliance<br />your legal team will love
                </h2>
                <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.75, marginBottom: 36 }}>
                  Chorus Observe is built for organizations where security isn't an afterthought.
                  Every enterprise control is first-class, not a bolt-on.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { icon: "🔐", title: "SAML2 & OAuth2 SSO", desc: "Okta, Azure AD, Google Workspace, Auth0 — any compliant IdP." },
                    { icon: "👥", title: "SCIM Provisioning", desc: "Automated user lifecycle management. Deprovision instantly on HR events." },
                    { icon: "🏛️", title: "Fine-Grained RBAC", desc: "Custom roles with 20+ permission scopes. Multi-tenant with strict isolation." },
                    { icon: "📜", title: "Immutable Audit Log", desc: "Every API action, user event, and data access logged with tamper-evident timestamps." },
                    { icon: "🗑️", title: "Data Retention Controls", desc: "Per-tenant retention policies. GDPR/CCPA-compliant deletion on request." },
                    { icon: "🔒", title: "Data Residency", desc: "EU, US, APAC deployment regions. Bring-your-own-key encryption." },
                  ].map(f => (
                    <div key={f.title} style={{ display: "flex", gap: 14 }}>
                      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{f.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: "#e2e8f0", marginBottom: 4 }}>{f.title}</div>
                        <div style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance badges */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { badge: "SOC 2", sub: "Type II", color: "#6366f1" },
                  { badge: "GDPR", sub: "Compliant", color: "#34d399" },
                  { badge: "HIPAA", sub: "Ready", color: "#22d3ee" },
                  { badge: "ISO 27001", sub: "Aligned", color: "#fbbf24" },
                ].map(b => (
                  <div key={b.badge} className="card-glow" style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${b.color}33`,
                    borderRadius: 16, padding: "28px 24px", textAlign: "center",
                    animation: "glow-pulse 4s ease-in-out infinite",
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>
                      {b.badge === "SOC 2" ? "🛡️" : b.badge === "GDPR" ? "🇪🇺" : b.badge === "HIPAA" ? "🏥" : "📋"}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 22, color: b.color }}>{b.badge}</div>
                    <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{b.sub}</div>
                  </div>
                ))}

                {/* JWT security note */}
                <div className="card-glow" style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16, padding: "20px 24px", gridColumn: "span 2",
                  fontFamily: "monospace", fontSize: 12, color: "#64748b", lineHeight: 1.8,
                }}>
                  <div style={{ color: "#34d399", marginBottom: 6, fontWeight: 600 }}>✓ Security Controls Active</div>
                  <div>• JWT httpOnly cookies — XSS-safe session storage</div>
                  <div>• JTI revocation blacklist — instant token invalidation</div>
                  <div>• Refresh token rotation — short-lived 15-min access tokens</div>
                  <div>• Brute-force lockout — 5 attempts → 15-min cooldown</div>
                  <div>• Rate limiting — 60 req/min per tenant enforced</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIALS ════════════════════════════════════════════════ */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9" }}>
              Trusted by teams building<br />
              <span className="shimmer-text">the world's best AI products</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              {
                quote: "We cut our LLM debugging time by 80%. The waterfall trace view is the first tool that actually shows us what our agents are doing at runtime, not just what we hoped they'd do.",
                author: "Sarah Chen", role: "Head of AI Engineering", company: "Meridian Labs",
                color: "#6366f1",
              },
              {
                quote: "The cost attribution per agent is a game-changer. We identified three agents burning $12k/month in redundant LLM calls. Fixed in a day. Chorus Observe paid for itself in week one.",
                author: "Marcus Webb", role: "VP Engineering", company: "Aria Systems",
                color: "#22d3ee",
              },
              {
                quote: "Red team suite caught a jailbreak vector in our customer-facing agent that none of our manual tests found. That one feature alone justifies the enterprise plan.",
                author: "Priya Nair", role: "AI Safety Lead", company: "Flux AI",
                color: "#34d399",
              },
            ].map(t => (
              <div key={t.author} className="card-glow" style={{
                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: "28px 24px", position: "relative",
              }}>
                <div style={{ position: "absolute", top: 0, left: 20, right: 20, height: 1, background: `linear-gradient(90deg, transparent, ${t.color}55, transparent)` }} />
                <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.8, marginBottom: 24, fontStyle: "italic" }}>
                  "{t.quote}"
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: `${t.color}22`, border: `1px solid ${t.color}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 16, color: t.color,
                  }}>{t.author[0]}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#e2e8f0" }}>{t.author}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ PRICING TEASER ══════════════════════════════════════════════ */}
        <section id="pricing" style={{
          background: "rgba(255,255,255,0.015)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "100px 0",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", marginBottom: 12 }}>
                Simple, transparent pricing
              </h2>
              <p style={{ color: "#64748b", fontSize: 16 }}>Open-core. Start free. Scale without fear.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {[
                {
                  name: "Community", price: "Free", period: "forever",
                  desc: "For individuals and small teams exploring LLM observability.",
                  features: ["Up to 100k traces/month", "7-day retention", "Basic dashboards", "Community support", "OTLP ingestion", "1 seat"],
                  cta: "Start Free", href: "/register", primary: false, color: "#6366f1",
                },
                {
                  name: "Pro", price: "$299", period: "/month",
                  desc: "For growing teams shipping AI to production.",
                  features: ["Up to 10M traces/month", "90-day retention", "All eval features", "Prompt A/B testing", "Cost budgets & alerts", "10 seats", "Email support"],
                  cta: "Start 14-Day Trial", href: "/register", primary: true, color: "#818cf8",
                },
                {
                  name: "Enterprise", price: "Custom", period: "",
                  desc: "For organizations with security, compliance, and scale requirements.",
                  features: ["Unlimited traces", "Custom retention", "SSO / SCIM / RBAC", "Audit logs", "Red team suite", "Data residency", "SLA + dedicated CSM", "Unlimited seats"],
                  cta: "Contact Sales", href: "#", primary: false, color: "#22d3ee",
                },
              ].map((plan, i) => (
                <div key={plan.name} className="card-glow" style={{
                  background: plan.primary ? `linear-gradient(145deg, rgba(99,102,241,0.12), rgba(129,140,248,0.06))` : "rgba(255,255,255,0.025)",
                  border: plan.primary ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 20, padding: "32px 28px", position: "relative",
                  boxShadow: plan.primary ? "0 0 40px rgba(99,102,241,0.15)" : undefined,
                }}>
                  {plan.primary && (
                    <div style={{
                      position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                      background: "linear-gradient(135deg, #6366f1, #818cf8)",
                      color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 14px", borderRadius: 999,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>Most Popular</div>
                  )}
                  <div style={{ marginBottom: 8, color: plan.color, fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
                    <span style={{ fontSize: 42, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.04em" }}>{plan.price}</span>
                    <span style={{ color: "#64748b", fontSize: 14 }}>{plan.period}</span>
                  </div>
                  <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 28, minHeight: 44 }}>{plan.desc}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span style={{ color: "#94a3b8", fontSize: 14 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href={plan.href} style={{
                    display: "block", textAlign: "center", padding: "12px",
                    borderRadius: 10, fontWeight: 700, fontSize: 14,
                    background: plan.primary ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "rgba(255,255,255,0.06)",
                    color: plan.primary ? "#fff" : "#cbd5e1",
                    border: plan.primary ? "none" : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: plan.primary ? "0 0 20px rgba(99,102,241,0.4)" : "none",
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                  >{plan.cta}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FINAL CTA ═══════════════════════════════════════════════════ */}
        <section style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: 700, height: 700,
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)",
            borderRadius: "50%", pointerEvents: "none",
          }} />
          <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
              borderRadius: 999, padding: "6px 18px", marginBottom: 32,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 10px #34d399", display: "block" }} />
              <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>LIVE — accepting signups</span>
            </div>

            <h2 style={{ fontSize: "clamp(34px, 5vw, 58px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#f1f5f9", marginBottom: 20, lineHeight: 1.1 }}>
              Start observing your<br />
              <span className="shimmer-text">AI systems in minutes</span>
            </h2>

            <p style={{ color: "#64748b", fontSize: 18, lineHeight: 1.75, marginBottom: 44 }}>
              No credit card. No lock-in. Just full-stack observability for your LLM agents,
              ready to go in under 5 minutes.
            </p>

            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/register" style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "#fff", fontWeight: 700, fontSize: 17,
                padding: "16px 36px", borderRadius: 12,
                boxShadow: "0 0 40px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
                transition: "all 0.25s",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 60px rgba(99,102,241,0.8), inset 0 1px 0 rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-2px) scale(1.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 40px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(0) scale(1)"; }}
              >
                Get Started — Free
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" /></svg>
              </Link>
              <a href="mailto:sales@chorusobserve.io" style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#cbd5e1", fontWeight: 600, fontSize: 17,
                padding: "16px 36px", borderRadius: 12,
                transition: "all 0.25s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
              >
                Talk to Sales
              </a>
            </div>

            <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
              {["No credit card required", "OTLP-native", "Open-core license"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569", fontSize: 13 }}>
                  <span style={{ color: "#34d399" }}>✓</span>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FOOTER ══════════════════════════════════════════════════════ */}
        <footer style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "60px 24px 40px",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 56 }}>
              {/* Brand */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <svg viewBox="0 0 32 32" fill="none" width="24" height="24">
                    <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z" fill="url(#footerGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <rect x="11" y="10" width="10" height="7" rx="1.5" fill="rgba(255,255,255,0.95)" />
                    <rect x="12.5" y="14" width="2" height="2" rx="0.5" fill="#22d3ee" />
                    <rect x="15" y="12.5" width="2" height="3.5" rx="0.5" fill="#6366f1" />
                    <rect x="17.5" y="13.5" width="2" height="2.5" rx="0.5" fill="#a78bfa" />
                    <defs>
                      <linearGradient id="footerGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#22d3ee" />
                        <stop offset="1" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em" }}>
                    Chorus <span style={{ color: "#6366f1" }}>Observe</span>
                  </span>
                </div>
                <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.7, maxWidth: 280, marginBottom: 20 }}>
                  Enterprise observability for LLM agents. Built for teams that ship AI to production at scale.
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  {["𝕏", "GitHub", "LinkedIn"].map(s => (
                    <a key={s} href="#" style={{
                      color: "#475569", fontSize: 12, fontWeight: 500,
                      padding: "6px 12px", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 6, transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    >{s}</a>
                  ))}
                </div>
              </div>

              {[
                { title: "Product", links: ["Features", "Integrations", "Changelog", "Roadmap", "Status"] },
                { title: "Company", links: ["About", "Blog", "Careers", "Security", "Contact"] },
                { title: "Resources", links: ["Documentation", "API Reference", "SDKs", "Community", "Support"] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#94a3b8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>{col.title}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {col.links.map(l => (
                      <a key={l} href="#" style={{ color: "#475569", fontSize: 14, transition: "color 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
                      >{l}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <span style={{ color: "#334155", fontSize: 13 }}>© 2026 Chorus Observe. All rights reserved.</span>
              <div style={{ display: "flex", gap: 24 }}>
                {["Privacy", "Terms", "Security", "Cookies"].map(l => (
                  <a key={l} href="#" style={{ color: "#334155", fontSize: 13, transition: "color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#64748b")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#334155")}
                  >{l}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
