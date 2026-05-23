"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, RefreshCw, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

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
      </div>
    </div>
  );
}
