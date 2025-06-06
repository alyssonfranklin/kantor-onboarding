"use client";

import { useState } from "react";
import { useLogin, useAuth, clientCsrf } from "@/lib/auth/index-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
// Import this for debugging
import { AUTH_URLS } from "@/lib/auth/constants";

/**
 * Login Form Component
 * 
 * A complete login form that works with the authentication system.
 * Includes remember me functionality and error handling.
 */
export default function LoginForm() {
  const { login, loginInProgress } = useLogin();
  const { error } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password, rememberMe);
      // Redirect happens automatically if login is successful
      // The SessionProvider will update the authentication state
    } catch (err) {
      // Error is handled by the login hook and stored in the auth context
      console.error("Login failed:", err);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Login to Voxerion</CardTitle>
      </CardHeader>
      <CardContent>
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
          
          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm">
              Remember me
            </label>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm py-2">{error}</div>
          )}
          
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loginInProgress}
          >
            {loginInProgress ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <Link href="/forgot-password" className="text-blue-600 hover:underline">
          Forgot your password?
        </Link>
      </CardFooter>
    </Card>
  );
}