"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Dashboard Page
 * 
 * Example of a protected page that requires authentication.
 * Demonstrates how to use the auth hooks and components.
 */
export default function DashboardPage() {
  // This page is wrapped with ProtectedRoute, so we know the user is authenticated
  // const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard/onboarding');
  }, [router]);
  
  return (
    <div className="border border-red-500">
      En el dashboard normal
    </div>
  );
}