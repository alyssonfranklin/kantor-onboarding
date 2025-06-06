"use client";

/**
 * Authentication Hooks
 * 
 * Custom React hooks for managing authentication state,
 * session handling, and user data.
 */

import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext, AuthContextType } from './context';
import { AUTH_URLS, SESSION_EVENTS, STORAGE_KEYS, SESSION_SETTINGS } from './constants';
import { JwtPayload } from './token-server';
import { getUserFromToken, needsRefresh, getTokenFromBrowser } from './token-client';
import { clientCsrf } from './csrf-client';

/**
 * Custom hook to access authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook for handling login functionality
 */
export function useLogin() {
  const { setUser, setIsAuthenticated, setLoading, setError } = useAuth();
  const [loginInProgress, setLoginInProgress] = useState(false);
  
  const login = useCallback(async (
    email: string, 
    password: string, 
    rememberMe: boolean = false
  ) => {
    setLoginInProgress(true);
    setLoading(true);
    setError(null);
    
    try {
      // Get CSRF token for the request
      const headers = clientCsrf.addToHeaders({
        'Content-Type': 'application/json'
      });
      
      console.log('Attempting login with URL:', AUTH_URLS.LOGIN);
      
      const response = await fetch(AUTH_URLS.LOGIN, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password, rememberMe }),
        credentials: 'include' // Important for cookies
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store the user data
      setUser(data.user);
      setIsAuthenticated(true);
      
      // If remember me is enabled, store in local storage
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      }
      
      // Dispatch login event for other tabs
      window.dispatchEvent(new CustomEvent(SESSION_EVENTS.LOGIN));
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setLoginInProgress(false);
      setLoading(false);
    }
  }, [setUser, setIsAuthenticated, setLoading, setError]);
  
  return { login, loginInProgress };
}

/**
 * Hook for handling logout functionality
 */
export function useLogout() {
  const { setUser, setIsAuthenticated, setLoading, setError } = useAuth();
  const [logoutInProgress, setLogoutInProgress] = useState(false);
  
  const logout = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      setLogoutInProgress(true);
      setLoading(true);
    }
    
    try {
      // Get CSRF token for the request
      const headers = clientCsrf.addToHeaders();
      
      // Call the logout API
      await fetch(AUTH_URLS.LOGOUT, {
        method: 'POST',
        headers,
        credentials: 'include'
      });
    } catch (err) {
      if (!options.silent) {
        setError(err instanceof Error ? err.message : 'Logout failed');
      }
      console.error('Logout error:', err);
    } finally {
      // Clear user data regardless of API success
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear remember me flag
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      
      // Dispatch logout event for other tabs
      window.dispatchEvent(new CustomEvent(SESSION_EVENTS.LOGOUT));
      
      if (!options.silent) {
        setLogoutInProgress(false);
        setLoading(false);
      }
    }
  }, [setUser, setIsAuthenticated, setLoading, setError]);
  
  return { logout, logoutInProgress };
}

/**
 * Hook for refreshing the authentication token
 */
export function useRefreshToken() {
  const { setUser, setIsAuthenticated, setError } = useAuth();
  const [refreshInProgress, setRefreshInProgress] = useState(false);
  
  const refreshToken = useCallback(async (options: { silent?: boolean } = {}) => {
    if (refreshInProgress) return;
    setRefreshInProgress(true);
    
    try {
      // Get CSRF token for the request
      const headers = clientCsrf.addToHeaders();
      
      const response = await fetch(AUTH_URLS.REFRESH, {
        method: 'POST',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      
      // Update user data if returned
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      }
      
      // Dispatch refresh event for other tabs
      window.dispatchEvent(new CustomEvent(SESSION_EVENTS.REFRESH));
      
      return data;
    } catch (err) {
      if (!options.silent) {
        setError(err instanceof Error ? err.message : 'Token refresh failed');
      }
      
      // If refresh fails, user may need to re-authenticate
      return null;
    } finally {
      setRefreshInProgress(false);
    }
  }, [setUser, setIsAuthenticated, setError, refreshInProgress]);
  
  return { refreshToken, refreshInProgress };
}

/**
 * Hook for monitoring session expiration
 */
export function useSessionMonitor() {
  const { isAuthenticated } = useAuth();
  const { refreshToken } = useRefreshToken();
  const { logout } = useLogout();
  
  const checkAndRefreshToken = useCallback(async () => {
    if (!isAuthenticated) return;
    
    const token = getTokenFromBrowser();
    if (!token) return;
    
    if (needsRefresh(token, SESSION_SETTINGS.REFRESH_THRESHOLD)) {
      console.log('Token needs refresh, refreshing...');
      await refreshToken({ silent: true });
    }
  }, [isAuthenticated, refreshToken]);
  
  // Set up interval to check token expiration
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Check immediately on mount
    checkAndRefreshToken();
    
    // Set up interval for periodic checks
    const interval = setInterval(
      checkAndRefreshToken, 
      SESSION_SETTINGS.REFRESH_INTERVAL
    );
    
    return () => clearInterval(interval);
  }, [isAuthenticated, checkAndRefreshToken]);
  
  // Listen for session events from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // If another tab logged out, logout this tab too
      if (event.key === STORAGE_KEYS.LAST_ACTIVE && event.newValue === null) {
        logout({ silent: true });
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout]);
  
  // Update last active timestamp
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const updateLastActive = () => {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
    };
    
    // Update on mount and on user activity
    updateLastActive();
    
    const events = ['mousedown', 'keydown', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateLastActive);
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateLastActive);
      });
    };
  }, [isAuthenticated]);
  
  return null;
}

/**
 * Hook to get the current authenticated user
 */
export function useUser(): {
  user: Omit<JwtPayload, 'iat' | 'exp'> | null;
  isAuthenticated: boolean;
  loading: boolean;
} {
  const { user, isAuthenticated, loading } = useAuth();
  return { user, isAuthenticated, loading };
}