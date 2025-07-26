"use client";

/**
 * Authentication Context
 * 
 * Provides the React context for managing authentication state
 * and sharing user data across components.
 */

import { createContext, ReactNode, useState, useEffect } from 'react';
import { JwtPayload, getUserFromToken, getTokenFromBrowser } from './token';
import { AUTH_URLS } from './constants';

/**
 * Authentication context type definition
 */
export interface AuthContextType {
  // User state
  user: Omit<JwtPayload, 'iat' | 'exp'> | null;
  setUser: (user: Omit<JwtPayload, 'iat' | 'exp'> | null) => void;
  
  // Authentication state
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  
  // Loading state
  loading: boolean;
  setLoading: (value: boolean) => void;
  
  // Error state
  error: string | null;
  setError: (error: string | null) => void;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props type
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Manages authentication state and provides it to all child components
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // User state
  const [user, setUser] = useState<Omit<JwtPayload, 'iat' | 'exp'> | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initial authentication check on mount
  useEffect(() => {
    const validateSession = async () => {
      try {
        setLoading(true);
        
        // Always validate with server since we use httpOnly cookies
        // Skip client-side token check as httpOnly cookies can't be read by JavaScript
        const response = await fetch(AUTH_URLS.VALIDATE, {
          method: 'GET',
          credentials: 'include', // Include cookies
        });
        
        if (!response.ok) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }
        
        // If valid, extract user data
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Session validation error:', err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    validateSession();
  }, []);
  
  // Create context value
  const contextValue: AuthContextType = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    loading,
    setLoading,
    error,
    setError,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}