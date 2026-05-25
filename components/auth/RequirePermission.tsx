"use client";

import { useAuth } from "@/hooks/useAuth";

interface RequirePermissionProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders {@code children} only when the authenticated user has the given
 * permission (or the {@code admin} permission). Renders {@code fallback}
 * (default: nothing) otherwise.
 *
 * Usage:
 *   <RequirePermission permission="users:write">
 *     <InviteUserButton />
 *   </RequirePermission>
 */
export function RequirePermission({
  permission,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}
