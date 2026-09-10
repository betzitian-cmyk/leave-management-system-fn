'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import NProgress from 'nprogress';
import { useAuth } from '@/lib/auth-context';
import type { UserRole } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  allowedRoles,
  redirectTo,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // If auth is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      NProgress.start();
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // If auth is not required but user is authenticated (login/register pages)
    if (!requireAuth && isAuthenticated && user) {
      // Redirect to role-specific dashboard
      const roleRedirects: Record<UserRole, string> = {
        GUEST: '/dashboard/guest',
        EMPLOYEE: '/dashboard/employee',
        MANAGER: '/dashboard/manager',
        HR_MANAGER: '/dashboard/hr',
        ADMIN: '/dashboard/admin',
      };
      const redirect = redirectTo || roleRedirects[user.role];
      NProgress.start();
      router.push(redirect);
      return;
    }

    // If specific roles are required
    if (requireAuth && isAuthenticated && allowedRoles && !hasRole(allowedRoles)) {
      // Redirect based on user role
      const roleRedirects: Record<UserRole, string> = {
        GUEST: '/dashboard/guest',
        EMPLOYEE: '/dashboard/employee',
        MANAGER: '/dashboard/manager',
        HR_MANAGER: '/dashboard/hr',
        ADMIN: '/dashboard/admin',
      };

      const defaultRedirect = user ? roleRedirects[user.role] : '/dashboard';
      NProgress.start();
      router.push(redirectTo || defaultRedirect);
    }
  }, [
    isAuthenticated,
    isLoading,
    requireAuth,
    allowedRoles,
    hasRole,
    router,
    pathname,
    redirectTo,
    user,
  ]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if auth check fails
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (!requireAuth && isAuthenticated) {
    return null;
  }

  if (requireAuth && isAuthenticated && allowedRoles && !hasRole(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
