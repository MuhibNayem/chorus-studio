"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/shell/Sidebar";
import TopBar from "@/components/shell/TopBar";
import TickStrip from "@/components/shell/TickStrip";
import CommandPalette from "@/components/shell/CommandPalette";
import { useAuth } from "@/hooks/useAuth";
import { setSessionExpiredHandler } from "@/lib/api";

const AUTH_PATHS = ["/login", "/register", "/landing"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  const openCmd = useCallback(() => setCmdOpen(true), []);

  // Register the global 401 handler so api.ts can trigger logout
  useEffect(() => {
    setSessionExpiredHandler(() => {
      logout().catch(() => null);
    });
  }, [logout]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="flex flex-col min-w-0 min-h-screen">
        <TopBar onOpenCmd={openCmd} />
        <TickStrip />
        <div className="page">
          {children}
        </div>
      </div>
      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
    </div>
  );
}
