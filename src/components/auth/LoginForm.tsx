"use client";

import { useState } from "react";
import { useLogin, useAuth, clientCsrf } from "@/lib/auth/index-client";
import { Button } from "@/components/ui/button";
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
    <form 
      onSubmit={handleSubmit} 
      className="space-y-4 p-8 border-none rounded-lg"
    >
      {/* CSRF Protection */}
      {clientCsrf.hiddenField()}
      
      {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
      
      <div>
        <label 
          htmlFor="email" 
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          type="text"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
          required
          placeholder='Enter your email'
        />
      </div>
      <div>
        <label 
          htmlFor="password" 
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
          placeholder='********'
        />
      </div>
      <div className='flex justify-between gap-4'>
        <div>
          <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="ml-2 text-sm font-semibold text-[#344054]">
                Remember for 30 days
              </span>
          </label>
        </div>
        <div>
          <Link
              href="/forgot-password"
              className="font-semibold text-[#E62E05] hover:underline"
            >
              Forgot password?
            </Link>
        </div>
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={loginInProgress}
      >
        {loginInProgress ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}