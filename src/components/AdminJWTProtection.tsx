// src/components/AdminJWTProtection.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminJWTProtectionProps {
  children: React.ReactNode;
}

const STORAGE_KEY = "kantor_jwt_token";
const SESSION_EXPIRY_KEY = "kantor_jwt_expiry";

export default function AdminJWTProtection({ children }: AdminJWTProtectionProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState('');

  // Check if valid JWT token exists
  useEffect(() => {
    const storedToken = sessionStorage.getItem(STORAGE_KEY);
    const expiryTime = sessionStorage.getItem(SESSION_EXPIRY_KEY);
    
    if (storedToken && expiryTime) {
      const now = Date.now();
      if (now < parseInt(expiryTime)) {
        setToken(storedToken);
        setIsAuthenticated(true);
      } else {
        // Token expired
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SESSION_EXPIRY_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate Voxerion admin email
    if (!email.endsWith('@voxerion.com')) {
      setError('Only Voxerion admin users can access this page');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.user.role === 'admin') {
        // Store JWT token
        const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
        sessionStorage.setItem(STORAGE_KEY, data.token);
        sessionStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
        
        setToken(data.token);
        setIsAuthenticated(true);
        setError('');
      } else if (data.success && data.user.role !== 'admin') {
        setError('Access denied. Admin role required.');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
    setIsAuthenticated(false);
    setToken('');
    setEmail('');
    setPassword('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white text-center">Voxerion Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="admin@voxerion.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
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
                className="w-full bg-[#E62E05] hover:bg-[#E62E05]/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Provide token to children through context or props
  return (
    <div>
      <div className="absolute top-4 right-4">
        <Button 
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="text-white border-gray-600"
        >
          Logout
        </Button>
      </div>
      {React.cloneElement(children as React.ReactElement, { adminToken: token })}
    </div>
  );
}