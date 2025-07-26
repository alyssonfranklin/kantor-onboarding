"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/index-client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  redirectTo?: string;
}

/**
 * Protected Route Component
 * 
 * Wraps components/pages that require authentication.
 * Redirects unauthenticated users to login page.
 * Can also check for specific roles.
 */
export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    console.log('🛡️ ProtectedRoute check:', { 
      loading, 
      isAuthenticated, 
      userRole: user?.role,
      userEmail: user?.email,
      requiredRole,
      currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    });
    
    // Only redirect after authentication check is complete
    if (loading) {
      console.log('⏳ Still loading, waiting...');
      return;
    }
    
    // If not authenticated, redirect to login with current URL as redirect parameter
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login');
      const currentUrl = window.location.pathname + window.location.search;
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentUrl)}`;
      router.push(loginUrl);
      return;
    }
    
    // If role check is required and user doesn't have the required role
    if (requiredRole && user) {
      const hasRequiredRole = Array.isArray(requiredRole)
        ? requiredRole.includes(user.role)
        : user.role === requiredRole;
      
      console.log('🔐 Role check result:', { 
        userRole: user.role, 
        requiredRole, 
        hasRequiredRole 
      });
      
      if (!hasRequiredRole) {
        console.log('🚫 Insufficient role, redirecting to unauthorized');
        router.push("/unauthorized");
      } else {
        console.log('✅ Role check passed, user can access page');
      }
    }
  }, [isAuthenticated, loading, redirectTo, requiredRole, router, user]);
  
  // Show loading state while checking authentication
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  // If authenticated and role check passes, show the children
  if (isAuthenticated && (!requiredRole || (user && 
      (Array.isArray(requiredRole) 
        ? requiredRole.includes(user.role) 
        : user.role === requiredRole)))) {
    return <>{children}</>;
  }
  
  // Return null while redirecting
  return null;
}