"use client";

/**
 * Session Management
 * 
 * Utilities for handling session expiration, logout,
 * and cross-domain/cross-tab session synchronization.
 */

import { SESSION_EVENTS, STORAGE_KEYS } from './constants';
import { getBrowserCookie, deleteBrowserCookie } from './cookies-client';
import { AUTH_TOKEN_NAME, REFRESH_TOKEN_NAME, CSRF_TOKEN_NAME } from './constants';

interface SessionEventData {
  type: string;
  timestamp: number;
  [key: string]: any;
}

/**
 * Broadcast a session event to other tabs/windows
 */
export function broadcastSessionEvent(event: string, data: object = {}): void {
  if (typeof window === 'undefined') return;
  
  const eventData: SessionEventData = {
    type: event,
    timestamp: Date.now(),
    ...data
  };
  
  // Use BroadcastChannel API if available
  if ('BroadcastChannel' in window) {
    try {
      const broadcastChannel = new BroadcastChannel('voxerion_auth_channel');
      broadcastChannel.postMessage(eventData);
      broadcastChannel.close();
    } catch (error) {
      console.error('Error broadcasting session event:', error);
    }
  }
  
  // Also use localStorage for fallback and compatibility
  try {
    localStorage.setItem(event, JSON.stringify(eventData));
    // Immediately remove to trigger storage events in other tabs
    localStorage.removeItem(event);
  } catch (error) {
    console.error('Error using localStorage for session event:', error);
  }
  
  // Dispatch DOM event for intra-tab communication
  window.dispatchEvent(new CustomEvent(event, { detail: eventData }));
}

/**
 * Clear all authentication data from the client
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  // Clear auth cookies
  deleteBrowserCookie(AUTH_TOKEN_NAME, { path: '/' });
  deleteBrowserCookie(REFRESH_TOKEN_NAME, { path: '/' });
  deleteBrowserCookie(CSRF_TOKEN_NAME, { path: '/' });
  
  // Clear localStorage items
  localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVE);
  
  // Broadcast the logout event
  broadcastSessionEvent(SESSION_EVENTS.LOGOUT);
}

/**
 * Handle session expiration
 */
export function handleSessionExpired(redirectTo?: string): void {
  // Clear auth data
  clearAuthData();
  
  // Broadcast session expired event
  broadcastSessionEvent(SESSION_EVENTS.EXPIRED);
  
  // If redirect URL provided, redirect the user
  if (redirectTo && typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }
}

/**
 * Set up session activity tracking
 */
export function setupSessionActivityTracking(): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const updateLastActive = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
    } catch (error) {
      console.error('Error updating last active timestamp:', error);
    }
  };
  
  // Update timestamp on various user interactions
  const events = ['mousedown', 'keydown', 'touchstart', 'click', 'scroll'];
  events.forEach(event => {
    window.addEventListener(event, updateLastActive, { passive: true });
  });
  
  // Initial update
  updateLastActive();
  
  // Return cleanup function
  return () => {
    events.forEach(event => {
      window.removeEventListener(event, updateLastActive);
    });
  };
}

/**
 * Detect session timeout based on inactivity
 * @param inactivityLimit Time in milliseconds before session is considered inactive
 */
export function setupInactivityDetection(
  inactivityLimit: number = 30 * 60 * 1000, // 30 minutes default
  onInactive?: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  let inactivityTimer: number | undefined;
  
  const checkActivity = () => {
    try {
      const lastActiveStr = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
      
      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        const now = Date.now();
        
        if (now - lastActive > inactivityLimit) {
          // Session is inactive
          if (onInactive) {
            onInactive();
          } else {
            // Default behavior: clear auth and broadcast expired event
            handleSessionExpired();
          }
        }
      }
    } catch (error) {
      console.error('Error checking session activity:', error);
    }
  };
  
  // Check every minute
  inactivityTimer = window.setInterval(checkActivity, 60 * 1000);
  
  // Return cleanup function
  return () => {
    if (inactivityTimer !== undefined) {
      clearInterval(inactivityTimer);
    }
  };
}

/**
 * Check if the current session is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for auth cookie
  return !!getBrowserCookie(AUTH_TOKEN_NAME);
}

/**
 * Set up a listener for session events
 */
export function listenForSessionEvents(
  events: string[],
  callback: (event: string, data: any) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handlers: Record<string, (e: Event) => void> = {};
  
  // Set up listeners for each event
  events.forEach(eventName => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(eventName, customEvent.detail || {});
    };
    
    window.addEventListener(eventName, handler);
    handlers[eventName] = handler;
  });
  
  // Set up storage event listener for cross-tab communication
  const storageHandler = (e: StorageEvent) => {
    if (events.includes(e.key || '')) {
      try {
        const data = e.newValue ? JSON.parse(e.newValue) : {};
        callback(e.key || '', data);
      } catch (error) {
        console.error('Error parsing session event data:', error);
      }
    }
  };
  
  window.addEventListener('storage', storageHandler);
  
  // Return cleanup function
  return () => {
    events.forEach(eventName => {
      if (handlers[eventName]) {
        window.removeEventListener(eventName, handlers[eventName]);
      }
    });
    
    window.removeEventListener('storage', storageHandler);
  };
}