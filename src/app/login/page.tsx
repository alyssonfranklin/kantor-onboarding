"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/index-client";
import { LoginForm } from "@/components/auth";
import NavBar from "@/components/client/NavBar";
import Image from "next/image";
import Link from "next/link";

/**
 * Login Page
 * 
 * The main login page that uses the auth system.
 * Redirects to dashboard if already authenticated.
 */
export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    console.log('isAuthenticated: ', isAuthenticated);
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);
  
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
              Log in to your account
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              Welcome back! Please enter your details.
            </div>
          </div>
            
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
        </div>
      </div>
    </div>
  );
}
