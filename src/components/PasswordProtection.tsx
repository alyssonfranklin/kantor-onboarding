// src/components/PasswordProtection.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PasswordProtectionProps {
  children: React.ReactNode;
}

const STORAGE_KEY = "kantor_admin_auth";

export default function PasswordProtection({ children }: PasswordProtectionProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the user is already authenticated
    const authStatus = sessionStorage.getItem(STORAGE_KEY);
    if (authStatus === "authenticated") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Verify password through an API route instead of client-side
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Save authentication status in session storage
        sessionStorage.setItem(STORAGE_KEY, "authenticated");
        setIsAuthenticated(true);
        setError('');
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An error occurred. Please try again.');
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