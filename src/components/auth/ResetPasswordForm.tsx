'use client';

import { useState } from 'react';
import { AUTH_URLS, clientCsrf } from "@/lib/auth/index-client";
import { Button } from '@/components/ui/button';

export default function ResetPasswordForm(
    { onHandleSuccess }
) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

      setIsSubmitting(true);
      
      const response = await fetch(AUTH_URLS.REQUEST_PASSWORD_RESET, {
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
      
      onHandleSuccess(email, resetUrl);
    } catch (err) {
      console.error("Password reset request failed:", err);
      setError("Failed to send password reset email. Please try again later.");
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
        onSubmit={handleSubmit} 
        className="space-y-4 p-8 border-none rounded-lg"
    >
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                placeholder='Enter your email'
            />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          { isSubmitting ? 'Sending...' : 'Sent reset link'}
        </Button>
    </form>
  );
}