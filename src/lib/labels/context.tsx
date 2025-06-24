"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LabelsContextType {
  labels: Record<string, string>;
  language: string;
  setLanguage: (lang: string) => void;
  loading: boolean;
  error: string | null;
}

const LabelsContext = createContext<LabelsContextType | undefined>(undefined);

interface LabelsProviderProps {
  children: ReactNode;
  defaultLanguage?: string;
}

export function LabelsProvider({ children, defaultLanguage = 'en' }: LabelsProviderProps) {
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<string>(defaultLanguage);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLabels = async (lang: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/v1/labels?locale=${lang}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch labels: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.labels) {
        setLabels(data.labels);
      } else {
        throw new Error('Invalid labels response format');
      }
    } catch (err) {
      console.error('Error fetching labels:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Fallback to basic English labels if fetch fails
      setLabels({
        welcome_title: 'Welcome to Voxerion',
        loading: 'Loading...',
        error: 'An error occurred',
        try_again: 'Try Again'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabels(language);
  }, [language]);

  // Persist language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('voxerion_language', language);
    }
  }, [language]);

  // Load language preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('voxerion_language');
      if (savedLanguage && ['en', 'pt', 'es'].includes(savedLanguage)) {
        setLanguage(savedLanguage);
      }
    }
  }, []);

  return (
    <LabelsContext.Provider
      value={{
        labels,
        language,
        setLanguage,
        loading,
        error
      }}
    >
      {children}
    </LabelsContext.Provider>
  );
}

export function useLabels(): LabelsContextType {
  const context = useContext(LabelsContext);
  if (context === undefined) {
    throw new Error('useLabels must be used within a LabelsProvider');
  }
  return context;
}