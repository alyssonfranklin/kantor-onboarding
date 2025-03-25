// src/components/PasswordProtection.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PasswordProtectionProps {
  children: React.ReactNode;
}

const STORAGE_KEY = "kantor_admin_auth";
const SESSION_EXPIRY_KEY = "kantor_auth_expiry";
const SESSION_DURATION = 3600000; // 1 hour in milliseconds

export default function PasswordProtection({ children }: PasswordProtectionProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if session is expired
  const checkSessionValidity = useCallback(() => {
    const authStatus = sessionStorage.getItem(STORAGE_KEY);
    const expiryTime = sessionStorage.getItem(SESSION_EXPIRY_KEY);
    
    if (authStatus === "authenticated" && expiryTime) {
      const now = Date.now();
      if (now < parseInt(expiryTime, 10)) {
        // Still valid, update expiry time
        const newExpiryTime = now + SESSION_DURATION;
        sessionStorage.setItem(SESSION_EXPIRY_KEY, newExpiryTime.toString());
        return true;
      } else {
        // Expired, clear session
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SESSION_EXPIRY_KEY);
      }
    }
    return false;
  }, []);

  useEffect(() => {
    // Check if the user is already authenticated with valid session
    const isValid = checkSessionValidity();
    setIsAuthenticated(isValid);
    setIsLoading(false);
    
    // Set up interval to periodically check session validity
    const interval = setInterval(checkSessionValidity, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [checkSessionValidity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Verify password through an API route instead of client-side
      const response = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'same-origin',
      });

      if (!response.ok && response.status === 429) {
        setError('Too many login attempts. Please try again later.');
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        // Save authentication status in session storage with expiry
        const expiryTime = Date.now() + SESSION_DURATION;
        sessionStorage.setItem(STORAGE_KEY, "authenticated");
        sessionStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
        setIsAuthenticated(true);
        setError('');
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
      // Clear password field after attempt
      setPassword('');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-800 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Kantor Admin Access</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block font-bold text-white mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-md text-black"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full font-bold bg-[#E62E05] hover:bg-[#E62E05]/90"
            >
              Access Admin Portal
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}