"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Search, RefreshCw, Bell, Sun, Moon, LogOut, User, Building2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

function useCrumbs(pathname: string) {
  const segs: { label: React.ReactNode; href?: string; cur?: boolean }[] = [
    { label: "acme-orchestrator", href: "/" },
  ];

  if (pathname === "/") segs.push({ label: "Overview", cur: true });
  else if (pathname === "/runs") segs.push({ label: "Runs", cur: true });
  else if (pathname.startsWith("/runs/")) {
    segs.push({ label: "Runs", href: "/runs" });
    const id = pathname.split("/")[2];
    segs.push({ label: <code>run_{id?.slice(0, 8)}…</code>, cur: true });
  } else if (pathname === "/agents") segs.push({ label: "Agents", cur: true });
  else if (pathname.startsWith("/agents/")) {
    segs.push({ label: "Agents", href: "/agents" });
    const id = pathname.split("/")[2];
    if (id === "register") segs.push({ label: "Register", cur: true });
    else segs.push({ label: <code>{id}</code>, cur: true });
  } else if (pathname === "/datasets") segs.push({ label: "Datasets", cur: true });
  else if (pathname === "/evaluators") segs.push({ label: "Evaluators", cur: true });
  else if (pathname === "/provenance") segs.push({ label: "Provenance", cur: true });
  else if (pathname === "/models") segs.push({ label: "Models", cur: true });
  else if (pathname === "/alerts") segs.push({ label: "Alerts", cur: true });
  else if (pathname === "/settings") segs.push({ label: "Settings", cur: true });

  return segs;
}

export default function TopBar({ onOpenCmd }: { onOpenCmd: () => void }) {
  const pathname = usePathname();
  const crumbs = useCrumbs(pathname);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="topbar">
      {/* Breadcrumbs */}
      <div className="crumbs">
        {crumbs.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="sep">/</span>}
            {s.cur ? (
              <span className="cur">{s.label}</span>
            ) : s.href ? (
              <Link href={s.href} className="hover:text-foreground transition-colors">
                {s.label}
              </Link>
            ) : (
              <span>{s.label}</span>
            )}
          </span>
        ))}
      </div>

      {/* Search trigger */}
      <div className="cmd-trigger" onClick={onOpenCmd}>
        <Search size={13} />
        <span>Search runs, spans, agents…</span>
        <span className="kbd">⌘K</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button className="icon-btn" aria-label="Refresh">
          <RefreshCw size={15} />
        </button>
        <button className="icon-btn" aria-label="Alerts">
          <Bell size={15} />
        </button>
        {mounted && (
          <button
            className="icon-btn"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        )}

        {/* User menu */}
        {isAuthenticated && user && (
          <div className="relative ml-1">
            <button
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <div
                className="flex items-center justify-center rounded-full text-white font-bold text-[10px]"
                style={{
                  width: 24,
                  height: 24,
                  background: "linear-gradient(135deg, hsl(var(--tool)), hsl(var(--llm)))",
                }}
              >
                {user.displayName?.slice(0, 2).toUpperCase() || user.email.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-medium hidden sm:block" style={{ color: "hsl(var(--foreground))" }}>
                {user.displayName || user.email}
              </span>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[200px] rounded-lg border shadow-lg"
                  style={{
                    background: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                  }}
                >
                  <div className="p-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center justify-center rounded-full text-white font-bold text-[11px]"
                        style={{
                          width: 28,
                          height: 28,
                          background: "linear-gradient(135deg, hsl(var(--tool)), hsl(var(--llm)))",
                        }}
                      >
                        {user.displayName?.slice(0, 2).toUpperCase() || user.email.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{user.displayName || user.email}</div>
                        <div className="text-[10px] truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-1">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <Building2 size={12} />
                      <span className="font-mono text-[10px]">{user.tenantId}</span>
                    </div>
                    <button
                      className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md hover:bg-muted/50 transition-colors"
                      style={{ color: "hsl(var(--error))" }}
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                    >
                      <LogOut size={12} />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
