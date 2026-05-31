import React, { useEffect, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = (): React.JSX.Element => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export interface ProtectedRouteProps {
  /** Optional custom spinner or node to render while authentication checks are pending. */
  fallback?: ReactNode;
  /** Element to render if the user is not authenticated. */
  unauthenticatedElement?: ReactNode;
}

/**
 * Route protection wrapper component that halts rendering until session state is loaded.
 * Redirects or displays appropriate fallback states if authentication fails.
 */
export default function ProtectedRoute({
  fallback = <DefaultFallback />,
  unauthenticatedElement
}: ProtectedRouteProps): React.JSX.Element | null {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth().catch((err: unknown) => {
        console.error("Failed checking auth:", err);
      });
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return fallback as React.JSX.Element;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    return (unauthenticatedElement ?? null) as React.JSX.Element | null;
  }

  if (!isAuthenticated) {
    return (unauthenticatedElement ?? null) as React.JSX.Element | null;
  }

  return <Outlet />;
}
