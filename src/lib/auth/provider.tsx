"use client";

/**
 * Authentication Provider Component
 * 
 * Main component for providing authentication state and
 * session management across the application.
 */

import { ReactNode, useEffect } from 'react';
import { AuthProvider } from './context';
import { useSessionMonitor } from './hooks';
import { SESSION_EVENTS } from './constants';

interface SessionMonitorProps {
  children?: ReactNode;
}

/**
 * Internal component for monitoring session activity
 * This is separated to avoid re-renders of the entire auth tree
 */
function SessionMonitor({ children }: SessionMonitorProps) {
  // Hook to monitor session expiration and refresh tokens
  useSessionMonitor();
  
  return <>{children}</>;
}

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * Top-level session provider component
 * Provides authentication context and session monitoring
 */
export function SessionProvider({ children }: SessionProviderProps) {
  // Set up cross-tab communication for session events
  useEffect(() => {
    // Function to handle events from other tabs
    const handleSessionEvent = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      
      // Check if it's a session-related event
      if (event.data.type === SESSION_EVENTS.LOGOUT) {
        // Force page reload to clear state when logged out in another tab
        window.location.reload();
      }
    };
    
    // Set up broadcast channel for cross-tab communication if supported
    let broadcastChannel: BroadcastChannel | undefined;
    
    if ('BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel('voxerion_auth_channel');
      broadcastChannel.addEventListener('message', handleSessionEvent);
    } else {
      // Fallback to localStorage for older browsers
      window.addEventListener('storage', (event) => {
        if (event.key === SESSION_EVENTS.LOGOUT) {
          window.location.reload();
        }
      });
    }
    
    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleSessionEvent);
        broadcastChannel.close();
      } else {
        window.removeEventListener('storage', handleSessionEvent as any);
      }
    };
  }, []);
  
  return (
    <AuthProvider>
      <SessionMonitor>
        {children}
      </SessionMonitor>
    </AuthProvider>
  );
}