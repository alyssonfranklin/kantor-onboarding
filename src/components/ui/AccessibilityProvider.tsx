'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface AccessibilityContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  setFocusTarget: (elementId: string) => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  toggleHighContrast: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<{ message: string; priority: 'polite' | 'assertive'; id: string }[]>([]);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  
  const announcementTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Detect user preferences on mount
  useEffect(() => {
    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(highContrastQuery.matches);
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };
    
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(reducedMotionQuery.matches);
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };
    
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // Load saved preferences
    const savedHighContrast = localStorage.getItem('voxerion-high-contrast');
    const savedFontSize = localStorage.getItem('voxerion-font-size');
    
    if (savedHighContrast !== null) {
      setIsHighContrast(savedHighContrast === 'true');
    }
    
    if (savedFontSize && ['small', 'medium', 'large'].includes(savedFontSize)) {
      setFontSize(savedFontSize as 'small' | 'medium' | 'large');
    }

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply high contrast
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply font size
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${fontSize}`);
    
    // Apply reduced motion
    if (isReducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [isHighContrast, fontSize, isReducedMotion]);

  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = Date.now().toString();
    
    setAnnouncements(prev => [...prev, { message, priority, id }]);
    
    // Remove announcement after it's been read
    const timeout = setTimeout(() => {
      setAnnouncements(prev => prev.filter(announcement => announcement.id !== id));
    }, 3000);
    
    announcementTimeoutRef.current.set(id, timeout);
  }, []);

  const setFocusTarget = useCallback((elementId: string) => {
    // Small delay to ensure element is rendered
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.focus();
        // If element is not naturally focusable, ensure it can receive focus
        if (!element.hasAttribute('tabindex')) {
          element.setAttribute('tabindex', '-1');
        }
      }
    }, 100);
  }, []);

  const toggleHighContrast = useCallback(() => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem('voxerion-high-contrast', newValue.toString());
    announceToScreenReader(`High contrast ${newValue ? 'enabled' : 'disabled'}`);
  }, [isHighContrast, announceToScreenReader]);

  const handleSetFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    localStorage.setItem('voxerion-font-size', size);
    announceToScreenReader(`Font size changed to ${size}`);
  }, [announceToScreenReader]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      announcementTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      announcementTimeoutRef.current.clear();
    };
  }, []);

  const contextValue: AccessibilityContextType = {
    announceToScreenReader,
    setFocusTarget,
    isHighContrast,
    isReducedMotion,
    fontSize,
    toggleHighContrast,
    setFontSize: handleSetFontSize,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* Live regions for screen reader announcements */}
      <div className="sr-only">
        {/* Polite announcements */}
        <div 
          aria-live="polite" 
          aria-atomic="true"
          role="status"
          id="polite-announcements"
        >
          {announcements
            .filter(a => a.priority === 'polite')
            .map(announcement => (
              <div key={announcement.id}>
                {announcement.message}
              </div>
            ))
          }
        </div>
        
        {/* Assertive announcements */}
        <div 
          aria-live="assertive" 
          aria-atomic="true"
          role="alert"
          id="assertive-announcements"
        >
          {announcements
            .filter(a => a.priority === 'assertive')
            .map(announcement => (
              <div key={announcement.id}>
                {announcement.message}
              </div>
            ))
          }
        </div>
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Accessibility toolbar component
interface AccessibilityToolbarProps {
  className?: string;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({ className = '' }) => {
  const { 
    isHighContrast, 
    fontSize, 
    toggleHighContrast, 
    setFontSize, 
    announceToScreenReader 
  } = useAccessibility();

  return (
    <div 
      className={`bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 ${className}`}
      role="toolbar"
      aria-label="Accessibility options"
    >
      <div className="flex items-center justify-center gap-4 text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Accessibility:
        </span>
        
        {/* High Contrast Toggle */}
        <button
          onClick={toggleHighContrast}
          className={`px-3 py-1 rounded transition-colors ${
            isHighContrast 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
          aria-pressed={isHighContrast}
          aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
        >
          High Contrast
        </button>
        
        {/* Font Size Controls */}
        <div className="flex items-center gap-1" role="group" aria-label="Font size options">
          <span className="text-gray-600 dark:text-gray-400 mr-2">Text:</span>
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                fontSize === size
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
              aria-pressed={fontSize === size}
              aria-label={`Set font size to ${size}`}
            >
              {size === 'small' ? 'A' : size === 'medium' ? 'A' : 'A'}
              <span className="sr-only">{size}</span>
            </button>
          ))}
        </div>

        {/* Skip to main content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-4 py-2 rounded z-50"
          onFocus={() => announceToScreenReader('Skip to main content link focused')}
        >
          Skip to main content
        </a>
      </div>
    </div>
  );
};