'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { PermissionKey } from '@/lib/rbac';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** User must have at least one of these permissions */
  allowedPermissions?: PermissionKey[];
  /** User must have at least one of these role ids (or legacy slugs: head_pastor, church_admin, finance_officer) */
  allowedRoles?: string[];
  /** If true, Head Pastor (super admin) always has access regardless of permissions */
  allowSuperAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  allowedPermissions,
  allowedRoles,
  allowSuperAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, authLoading, hasPermission, hasRole, isSuperAdmin } =
    useAuth();
  const router = useRouter();

  const hasRequiredPermission =
    !allowedPermissions?.length ||
    allowedPermissions.some((p) => hasPermission(p)) ||
    (allowSuperAdmin && isSuperAdmin);
  const hasRequiredRole =
    !allowedRoles?.length || allowedRoles.some((r) => hasRole(r));

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }
    if (allowedPermissions?.length && !hasRequiredPermission) {
      router.push('/dashboard');
      return;
    }
    if (allowedRoles?.length && !hasRequiredRole) {
      router.push('/dashboard');
    }
  }, [
    authLoading,
    isAuthenticated,
    allowedPermissions,
    allowedRoles,
    hasRequiredPermission,
    hasRequiredRole,
    router,
  ]);

  if (authLoading) return null;
  if (!isAuthenticated) return null;
  if (allowedPermissions?.length && !hasRequiredPermission) return null;
  if (allowedRoles?.length && !hasRequiredRole) return null;

  return <>{children}</>;
}
