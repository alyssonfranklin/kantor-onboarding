"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { clientCsrf } from "@/lib/auth";

/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset link.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get CSRF token for the request
      const headers = clientCsrf.addToHeaders({
        'Content-Type': 'application/json'
      });
      
      const response = await fetch('/api/v1/auth/reset-password/request', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }
      
      // In development, we return the reset URL for testing
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
      
      setIsSubmitted(true);
    } catch (err) {
      console.error("Password reset request failed:", err);
      setError("Failed to send password reset email. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show success message after submission
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              If an account exists for {email}, we've sent instructions to reset your password.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Please check your inbox and spam folder. The link will expire in 5 minutes.
            </p>
            
            {/* Show reset URL in development mode for testing */}
            {resetUrl && process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-100 rounded-md text-left">
                <p className="font-semibold mb-2">Development Testing Link:</p>
                <a 
                  href={resetUrl}
                  className="text-blue-600 hover:underline break-all text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resetUrl}
                </a>
                <p className="mt-2 text-xs text-gray-500">
                  This link is only shown in development mode.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/login">
              <Button variant="outline">Return to Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Show the password reset request form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6 text-center">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CSRF Protection */}
            {clientCsrf.hiddenField()}
            
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
                placeholder="youremail@example.com"
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
              {isSubmitting ? "Sending..." : "Send Reset Instructions"}
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