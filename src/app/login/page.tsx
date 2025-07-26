"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/index-client";
import { LoginForm } from "@/components/auth";
import NavBar from "@/components/client/NavBar";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Login Page
 * 
 * The main login page that uses the auth system.
 * Redirects to dashboard if already authenticated.
 */
export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Admin login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  
  // Check if this is an admin redirect (from AdminJWTProtection)
  useEffect(() => {
    if (redirectUrl && redirectUrl !== '/dashboard') {
      setShowAdminLogin(true);
    }
  }, [redirectUrl]);
  
  // Redirect to dashboard if already logged in (regular users)
  useEffect(() => {
    console.log('isAuthenticated: ', isAuthenticated);
    if (!loading && isAuthenticated && !showAdminLogin) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router, showAdminLogin]);
  
  // Admin login handler
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminSubmitting(true);
    setAdminError('');

    // Validate Voxerion admin email
    if (!adminEmail.endsWith('@voxerion.com')) {
      setAdminError('Only Voxerion admin users can access this page');
      setIsAdminSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      const data = await response.json();

      if (data.success && data.user.role === 'admin') {
        // Store JWT token
        const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
        sessionStorage.setItem('kantor_jwt_token', data.token);
        sessionStorage.setItem('kantor_jwt_expiry', expiryTime.toString());
        
        // Redirect to original URL
        window.location.href = redirectUrl;
      } else if (data.success && data.user.role !== 'admin') {
        setAdminError('Access denied. Admin role required.');
      } else {
        setAdminError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setAdminError('Authentication failed. Please try again.');
    } finally {
      setIsAdminSubmitting(false);
    }
  };
  
  // Show loading state if checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // If not authenticated, show login form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center m-0 p-0">
      <div className="w-full">
        <NavBar />
      </div>
      <div className="w-full min-h-screen flex justify-center pt-4 md:pt-10">
        <div className='w-11/12 md:w-2/5'>
          <div className='flex justify-center'>
            <Image
              src="/voxerion-logo.png" 
              alt="Voxerion Logo" 
              width={32} 
              height={32} 
            />
          </div>

          <div className='text-center'>
            <h2 className="text-2xl font-bold my-2">
              {showAdminLogin ? 'Admin Access Required' : 'Log in to your account'}
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              {showAdminLogin ? 'Please sign in with your Voxerion admin account.' : 'Welcome back! Please enter your details.'}
            </div>
          </div>
            
          {showAdminLogin ? (
            // Admin login form
            <form onSubmit={handleAdminSubmit} className="space-y-4 p-8 border-none rounded-lg">
              {adminError && (
                <Alert variant="destructive">
                  <AlertDescription>{adminError}</AlertDescription>
                </Alert>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full p-3 rounded-md border border-gray-300 focus:border-blue-500 focus:outline-none"
                  placeholder="admin@voxerion.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full p-3 rounded-md border border-gray-300 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#E62E05] hover:bg-[#E62E05]/90"
                disabled={isAdminSubmitting}
              >
                {isAdminSubmitting ? 'Authenticating...' : 'Sign In as Admin'}
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Regular user login
                </button>
              </div>
            </form>
          ) : (
            // Regular user login form
            <>
              <LoginForm />
              <p className="mt-2 text-center text-sm text-gray-600">
                Don&apos;t have an account?{'  '}
                <Link
                  href="/welcome"
                  className="font-semibold text-[#E62E05] hover:underline"
                >
                  Sign up
                </Link>
              </p>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(true)}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Admin login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
