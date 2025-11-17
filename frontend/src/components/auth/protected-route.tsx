'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, usePermission } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAllPermissions?: boolean;
  fallbackUrl?: string;
}

/**
 * Client-side route protection component
 * Wraps content that requires authentication or specific permissions
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  requiredPermissions,
  requireAllPermissions = false,
  fallbackUrl = '/403',
}: ProtectedRouteProps) {
  console.log('[PROTECTED ROUTE] Component rendering...');
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasRole, hasAnyRole, hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermission();

  console.log('[PROTECTED ROUTE] Initial render state:', { isAuthenticated, isLoading, user: user?.email });

  useEffect(() => {
    console.log('[PROTECTED ROUTE] Auth state:', { isAuthenticated, isLoading, user: user?.email });

    // CRITICAL: Always wait for loading to complete before making any decisions
    if (isLoading) {
      console.log('[PROTECTED ROUTE] Still loading, waiting...');
      return;
    }

    // Only redirect if we're sure the user is not authenticated AND loading is complete
    if (!isAuthenticated && !isLoading) {
      console.log('[PROTECTED ROUTE] Not authenticated after loading complete, redirecting to login');
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (isAuthenticated) {
      console.log('[PROTECTED ROUTE] Authenticated, rendering children');
    }

    // Check role requirements
    if (requiredRole && !hasRole(requiredRole)) {
      router.push(fallbackUrl);
      return;
    }

    if (requiredRoles && !hasAnyRole(requiredRoles)) {
      router.push(fallbackUrl);
      return;
    }

    // Check permission requirements
    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push(fallbackUrl);
      return;
    }

    if (requiredPermissions) {
      const hasAccess = requireAllPermissions
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);

      if (!hasAccess) {
        router.push(fallbackUrl);
        return;
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    requiredRole,
    requiredRoles,
    requiredPermission,
    requiredPermissions,
    requireAllPermissions,
    fallbackUrl,
    router,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  ]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Check role requirements before rendering
  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return null;
  }

  // Check permission requirements before rendering
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  if (requiredPermissions) {
    const hasAccess = requireAllPermissions
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return null;
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
}
