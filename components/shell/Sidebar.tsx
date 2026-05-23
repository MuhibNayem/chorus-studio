"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  List,
  Database,
  Sparkles,
  GitBranch,
  Cpu,
  Server,
  Bell,
  Settings,
  ChevronsUpDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const workspaceItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard, kbd: "G O" },
  { href: "/runs", label: "Runs", icon: List, kbd: "G R", badge: "128.4k" },
  { href: "/datasets", label: "Datasets", icon: Database, kbd: "G D" },
  { href: "/evaluators", label: "Evaluators", icon: Sparkles, kbd: "G E" },
  { href: "/provenance", label: "Provenance", icon: GitBranch },
];

const platformItems = [
  { href: "/agents", label: "Agents", icon: Cpu, badge: "5" },
  { href: "/models", label: "Models", icon: Server },
  { href: "/alerts", label: "Alerts", icon: Bell, badge: "3" },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const initials = user?.displayName?.slice(0, 2).toUpperCase()
    || user?.email?.slice(0, 2).toUpperCase()
    || "??";
  const name = user?.displayName || user?.email || "Guest";
  const org = user?.tenantId || "—";

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.4" />
            <circle cx="12" cy="12" r="6" stroke="hsl(var(--primary-bright))" strokeWidth="1.5" opacity="0.7" />
            <circle cx="12" cy="12" r="2.5" fill="hsl(var(--primary-bright))" />
            <path d="M1 12 L4 12 L6 8 L9 16 L12 4 L15 18 L18 10 L20 12 L23 12"
              stroke="hsl(var(--primary-bright))" strokeWidth="1.2" fill="none"
              strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          </svg>
        </div>
        <div className="brand-name">
          Chorus <span style={{ opacity: 0.7 }}>Observe</span>
          <span className="sub">β</span>
        </div>
      </div>

      {/* Project switcher */}
      <div className="proj-switcher">
        <div className="pdot">{org.slice(0, 2).toUpperCase()}</div>
        <div className="pmeta">
          <div className="pname">{org}</div>
          <div className="penv">production · us-east-1</div>
        </div>
        <ChevronsUpDown size={13} className="text-muted-foreground shrink-0" />
      </div>

      {/* Workspace section */}
      <div className="side-section">Workspace</div>
      <nav className="side-nav">
        {workspaceItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${active ? "active" : ""}`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="badge-count">{item.badge}</span>
              ) : (
                <span className="kbd">{item.kbd}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Platform section */}
      <div className="side-section">Platform</div>
      <nav className="side-nav">
        {platformItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${active ? "active" : ""}`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
              {item.badge && <span className="badge-count">{item.badge}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="side-footer">
        <div className="flex items-center gap-2" style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
          <span className="tick-strip" style={{ padding: 0, border: 0, background: "none" }}>
            <span className="live-dot" />
          </span>
          <span className="mono tabular">v1.4.2 · connected</span>
        </div>
        <div className="user">
          <div className="avatar">{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="uname">{name}</div>
            <div className="uorg">{org} · {user?.permissions?.includes("admin") ? "admin" : "member"}</div>
          </div>
          <ChevronsUpDown size={13} className="text-muted-foreground shrink-0" />
        </div>
      </div>
    </aside>
  );
}
