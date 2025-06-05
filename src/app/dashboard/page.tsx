"use client";

import { useAuth } from "@/lib/auth";
import { ProtectedRoute, LogoutButton } from "@/components/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Dashboard Page
 * 
 * Example of a protected page that requires authentication.
 * Demonstrates how to use the auth hooks and components.
 */
export default function DashboardPage() {
  // This page is wrapped with ProtectedRoute, so we know the user is authenticated
  const { user } = useAuth();
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <LogoutButton redirectTo="/" />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {user?.name || user?.email}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>You are now logged in with the following details:</p>
              
              <div className="bg-gray-100 p-4 rounded-md">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify({
                    id: user?.id,
                    email: user?.email,
                    role: user?.role,
                    company_id: user?.company_id
                  }, null, 2)}
                </pre>
              </div>
              
              <p>
                This session will work seamlessly across the app.voxerion.com domain
                and subdomains thanks to the secure cross-domain authentication setup.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}