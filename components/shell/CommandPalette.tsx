"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  List,
  Database,
  Sparkles,
  Activity,
  Plus,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

const recentRuns = [
  { id: "8f3c2b1a-77e4-4811-a3e1-bd31c4fa61cc", framework: "LangGraph", agent: "ag_observability_v2" },
  { id: "2d1e4a09-c84a-4f5d-8b71-3e017f2cbe44", framework: "LangChain", agent: "ag_research" },
  { id: "91a3f0c1-8d77-49e2-aa64-114c2db21f30", framework: "Chorus", agent: "ag_router_v3" },
  { id: "3b7c9e2d-1f44-4a18-9eb3-77f8024f9d3a", framework: "LangGraph", agent: "ag_observability_v2" },
  { id: "5e4a8c0d-2b91-4e88-bf12-8014f8e6cb20", framework: "Chorus", agent: "ag_router_v3" },
];

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const all = useMemo(() => [
    {
      sec: "Navigate",
      items: [
        { label: "Overview", icon: LayoutDashboard, kbd: "G O", action: () => router.push("/") },
        { label: "All runs", icon: List, kbd: "G R", action: () => router.push("/runs") },
        { label: "Datasets", icon: Database, kbd: "G D", action: () => router.push("/datasets") },
        { label: "Evaluators", icon: Sparkles, kbd: "G E", action: () => router.push("/evaluators") },
      ] as { label: string; icon: typeof Activity; kbd?: string; sub?: string; action: () => void }[],
    },
    {
      sec: "Recent runs",
      items: recentRuns.map((r) => ({
        label: `run_${r.id.slice(0, 8)}…`,
        sub: `${r.framework} · ${r.agent}`,
        icon: Activity,
        action: () => router.push(`/runs/${r.id}`),
      })) as { label: string; icon: typeof Activity; kbd?: string; sub?: string; action: () => void }[],
    },
    {
      sec: "Actions",
      items: [
        { label: "Create dataset from selection", icon: Plus, action: () => {} },
        { label: "Replay last failed run", icon: RefreshCw, action: () => {} },
        { label: "Open Chorus engine docs", icon: ExternalLink, action: () => window.open("https://github.com/MuhibNayem/chorus-engine4j", "_blank") },
      ] as { label: string; icon: typeof Activity; kbd?: string; sub?: string; action: () => void }[],
    },
  ], [router]);

  const filtered = useMemo(() => {
    const f = all.map((s) => ({
      ...s,
      items: s.items.filter((it) =>
        (it.label + (it.sub || "")).toLowerCase().includes(q.toLowerCase())
      ),
    })).filter((s) => s.items.length > 0);
    return f;
  }, [all, q]);

  const flat = useMemo(() => filtered.flatMap((s) => s.items), [filtered]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { setSel((s) => Math.min(s + 1, flat.length - 1)); e.preventDefault(); }
    else if (e.key === "ArrowUp") { setSel((s) => Math.max(s - 1, 0)); e.preventDefault(); }
    else if (e.key === "Enter") { flat[sel]?.action(); onClose(); }
    else if (e.key === "Escape") { onClose(); }
  };

  let idx = -1;
  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmd-input"
          placeholder="Search runs, spans, agents, datasets…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setSel(0); }}
          onKeyDown={onKey}
        />
        <div className="cmd-list">
          {filtered.map((s, si) => (
            <div key={si}>
              <div className="cmd-section">{s.sec}</div>
              {s.items.map((it) => {
                idx++;
                const mine = idx;
                const Icon = it.icon;
                return (
                  <div
                    key={mine}
                    className={`cmd-item ${mine === sel ? "sel" : ""}`}
                    onClick={() => { it.action(); onClose(); }}
                    onMouseEnter={() => setSel(mine)}
                  >
                    <Icon size={14} className="icon shrink-0" />
                    <span className="flex-1 min-w-0">
                      {it.label}
                      {it.sub && (
                        <span style={{ marginLeft: 8, color: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                          {it.sub}
                        </span>
                      )}
                    </span>
                    {it.kbd && <span className="kbd">{it.kbd}</span>}
                  </div>
                );
              })}
            </div>
          ))}
          {flat.length === 0 && (
            <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
              No results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
