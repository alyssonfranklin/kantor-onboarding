'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AUTH_URLS } from '@/lib/auth/constants';
import { clientCsrf } from "@/lib/auth/index-client";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const resendEmail = async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setError('');
      const res = await fetch('/api/v1/auth/reset-password/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to resend email');
      }
  };

  const goToLogin = () => {
    router.push('/pages');
  };

  return (
    <div className='w-11/12 md:w-2/5'>
        <div className='flex justify-center'>
            <Image src="/voxerion-logo.png" alt="Voxerion Logo" width={32} height={32} />
        </div>

        <div className='text-center'>
            <h2 className="text-2xl font-bold my-2">
                Reset your password
            </h2>
            {
                !showConfirm &&
                <div className='text-gray-600 pt-0 mt-0'>
                    Can't remember your password? Enter your email address and we will send you an email to create a new password.
                </div>
            }

            {
                showConfirm &&
                <div className='text-gray-600 pt-0 mt-0'>
                    If an account exists for that email address, we have sent you an email with a link to reset your password.
                </div>
            }
            
        </div>

        {
            !showConfirm &&
            <>
                <form 
                    onSubmit={handleSubmit} 
                    className="space-y-4 p-8 border-none rounded-lg"
                >
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                            placeholder='Enter your email'
                        />
                    </div>
                    
                    <button
                        type="submit"
                        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-primary-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Sent reset link
                    </button>
                </form>

                <p className="mt-2 text-center text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <a
                        href="/pages/public/signup"
                        className="font-semibold text-[#E62E05] hover:underline"
                    >
                        Sign up
                    </a>
                </p>
            </>
        }

        {
            showConfirm &&
            <div className='py-4'>
                <button
                    type="button"
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-primary-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={goToLogin}
                >
                    Login
                </button>

                <p className="mt-2 text-center text-sm text-gray-600">
                    Didn’t receive an email?{' '}
                    <a
                        href="#"
                        className="font-semibold text-[#E62E05] hover:underline"
                        onClick={resendEmail}
                    >
                        Resend
                    </a>
                </p>

            </div>
        }
        
    </div>
  );
}