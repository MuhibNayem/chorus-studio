"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * Client-side auth guard — supplements the edge middleware with a React-layer
 * redirect for cases where the cookie is cleared between navigations.
 *
 * Wrap each protected page root with this component:
 *
 *   export default function DashboardPage() {
 *     return (
 *       <AuthGuard>
 *         <DashboardContent />
 *       </AuthGuard>
 *     );
 *   }
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        aria-label="Loading…"
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid hsl(var(--border))",
            borderTopColor: "hsl(var(--primary))",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
