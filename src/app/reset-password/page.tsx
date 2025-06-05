"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { clientCsrf } from "@/lib/auth/index-client";

/**
 * Loading component shown while page is loading
 */
function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="animate-pulse">
            <p>Loading password reset...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Reset Password Form Component
 */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Verify token on page load
  useEffect(() => {
    if (!token) {
      setError("Missing reset token. Please request a new password reset link.");
      setIsVerifying(false);
      return;
    }
    
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/v1/auth/reset-password/verify?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Invalid or expired reset token");
        }
        
        // Token is valid, store email for display
        setUserEmail(data.email);
        setIsVerifying(false);
      } catch (err) {
        console.error("Token verification failed:", err);
        setError("This password reset link has expired or is invalid. Please request a new one.");
        setIsVerifying(false);
      }
    };
    
    verifyToken();
  }, [token]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get CSRF token for the request
      const headers = clientCsrf.addToHeaders({
        'Content-Type': 'application/json'
      });
      
      const response = await fetch('/api/v1/auth/reset-password/confirm', {
        method: 'POST',
        headers,
        body: JSON.stringify({ token, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      
      // Password reset successful
      setIsCompleted(true);
    } catch (err) {
      console.error("Password reset failed:", err);
      setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <div className="animate-pulse">
              <p>Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show error if token is invalid
  if (error && !isSubmitting && !isCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-red-600">Reset Link Invalid</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/forgot-password">
              <Button>Request New Reset Link</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Show success message after password reset
  if (isCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-green-600">Password Reset Complete</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">Your password has been successfully reset.</p>
            <p>You can now log in with your new password.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Show password reset form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          {userEmail && (
            <p className="text-gray-600 mb-6 text-center">
              Creating a new password for <strong>{userEmail}</strong>
            </p>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CSRF Protection */}
            {clientCsrf.hiddenField()}
            
            {/* New Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
                minLength={8}
              />
              <p className="text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>
            
            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm py-2">{error}</div>
            )}
            
            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Reset Password Page
 * 
 * Handles the password reset flow after a user clicks a reset link.
 * Wrapped with Suspense to handle useSearchParams properly.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}