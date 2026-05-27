"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  tenantId: string;
  permissions: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  login: (tenantId: string, email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate session from the /api/auth/me Next.js route (reads httpOnly cookie server-side)
  const hydrate = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser({
          userId: data.userId,
          email: data.email,
          displayName: data.displayName,
          tenantId: data.tenantId,
          permissions: data.permissions ?? [],
        });
        return true;
      }
    } catch {
      // network error — leave user as null
    }
    setUser(null);
    return false;
  }, []);

  useEffect(() => {
    // Skip the session check on public pages — no cookie exists there yet
    const path = window.location.pathname;
    const isPublic = path === "/login" || path === "/register" || path === "/landing";
    if (isPublic) {
      setIsLoading(false);
      return;
    }
    hydrate().finally(() => setIsLoading(false));
  }, [hydrate]);

  // Schedule proactive refresh 60 seconds before the 15-min access token expires
  useEffect(() => {
    if (!user) return;
    const delay = (15 * 60 - 60) * 1000; // 14 minutes
    refreshTimerRef.current = setTimeout(async () => {
      await refreshSession();
    }, delay);
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const login = useCallback(async (tenantId: string, email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tenantId, email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("chorus_tenant_id", data.tenantId);
    setUser({
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      tenantId: data.tenantId,
      permissions: data.permissions ?? [],
    });
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, displayName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Registration failed");
    }
    const data = await res.json();
    localStorage.setItem("chorus_tenant_id", data.tenantId);
    setUser({
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      tenantId: data.tenantId,
      permissions: data.permissions ?? [],
    });
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => null);
    setUser(null);
    window.location.href = "/landing";
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser({
          userId: data.userId,
          email: data.email,
          displayName: data.displayName,
          tenantId: data.tenantId,
          permissions: data.permissions ?? [],
        });
        return true;
      }
    } catch {
      // network error
    }
    setUser(null);
    return false;
  }, []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      return user.permissions.includes(permission) || user.permissions.includes("admin");
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        hasPermission,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
