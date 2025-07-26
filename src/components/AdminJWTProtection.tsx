// src/components/AdminJWTProtection.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface AdminJWTProtectionProps {
  children: React.ReactNode;
}

const STORAGE_KEY = "kantor_jwt_token";
const SESSION_EXPIRY_KEY = "kantor_jwt_expiry";

export default function AdminJWTProtection({ children }: AdminJWTProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
    setIsAuthenticated(false);
    setToken('');
    // Redirect to login page
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return URL
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
    const loginUrl = `/login?redirect=${encodeURIComponent(currentUrl)}`;
    
    if (typeof window !== 'undefined') {
      window.location.href = loginUrl;
    }
    
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white">Redirecting to login...</div>
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