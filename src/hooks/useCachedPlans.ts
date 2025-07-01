'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PricingTier, PricingResponse } from '@/types/payment';
import { SubscriptionAnalytics } from '@/lib/monitoring/subscription-analytics';

interface CacheEntry {
  data: PricingTier[];
  timestamp: number;
  billingPeriod: 'monthly' | 'annual';
}

interface UseCachedPlansOptions {
  billingPeriod: 'monthly' | 'annual';
  cacheTimeout?: number; // in milliseconds, default 5 minutes
  enableRetry?: boolean;
  maxRetries?: number;
}

interface UseCachedPlansReturn {
  pricingTiers: PricingTier[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isStale: boolean;
  cacheHit: boolean;
}

// In-memory cache for pricing data
const pricingCache = new Map<string, CacheEntry>();

// Performance metrics
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  totalRequests: 0,
  averageResponseTime: 0,
};

export const useCachedPlans = ({
  billingPeriod,
  cacheTimeout = 5 * 60 * 1000, // 5 minutes default
  enableRetry = true,
  maxRetries = 3,
}: UseCachedPlansOptions): UseCachedPlansReturn => {
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [cacheHit, setCacheHit] = useState(false);
  
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestStartTimeRef = useRef<number>(0);

  const getCacheKey = useCallback((period: 'monthly' | 'annual') => {
    return `pricing_${period}`;
  }, []);

  const isCacheValid = useCallback((entry: CacheEntry) => {
    const now = Date.now();
    const age = now - entry.timestamp;
    return age < cacheTimeout && entry.billingPeriod === billingPeriod;
  }, [cacheTimeout, billingPeriod]);

  const updatePerformanceMetrics = useCallback((responseTime: number, fromCache: boolean) => {
    performanceMetrics.totalRequests++;
    if (fromCache) {
      performanceMetrics.cacheHits++;
    } else {
      performanceMetrics.cacheMisses++;
    }
    
    // Update rolling average
    performanceMetrics.averageResponseTime = 
      (performanceMetrics.averageResponseTime * (performanceMetrics.totalRequests - 1) + responseTime) 
      / performanceMetrics.totalRequests;

    // Log performance metrics periodically
    if (performanceMetrics.totalRequests % 10 === 0) {
      console.log('Pricing Cache Performance:', {
        hitRate: (performanceMetrics.cacheHits / performanceMetrics.totalRequests * 100).toFixed(1) + '%',
        averageResponseTime: performanceMetrics.averageResponseTime.toFixed(0) + 'ms',
        totalRequests: performanceMetrics.totalRequests,
      });
    }
  }, []);

  const fetchFromCache = useCallback(() => {
    const cacheKey = getCacheKey(billingPeriod);
    const cachedEntry = pricingCache.get(cacheKey);
    
    if (cachedEntry && isCacheValid(cachedEntry)) {
      const responseTime = Date.now() - requestStartTimeRef.current;
      updatePerformanceMetrics(responseTime, true);
      
      setPricingTiers(cachedEntry.data);
      setLoading(false);
      setError(null);
      setCacheHit(true);
      setIsStale(false);
      return true;
    }
    
    // Check for stale cache data
    if (cachedEntry) {
      setPricingTiers(cachedEntry.data);
      setIsStale(true);
      setCacheHit(true);
    }
    
    return false;
  }, [billingPeriod, getCacheKey, isCacheValid, updatePerformanceMetrics]);

  const fetchFromAPI = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        requestStartTimeRef.current = Date.now();
        setLoading(true);
        setError(null);
        setCacheHit(false);
      }

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Track API request
      if (!isRetry) {
        await SubscriptionAnalytics.trackEvent({
          type: 'subscription_created',
          userId: 'anonymous',
          companyId: 'anonymous',
          metadata: {
            action: 'fetch_pricing',
            billing_period: billingPeriod,
            from_cache: false,
          },
          timestamp: new Date(),
        });
      }

      const response = await fetch(`/api/plans?billing_period=${billingPeriod}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'max-age=300', // Browser cache for 5 minutes
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PricingResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load pricing plans');
      }

      const responseTime = Date.now() - requestStartTimeRef.current;
      updatePerformanceMetrics(responseTime, false);

      // Cache the successful response
      const cacheKey = getCacheKey(billingPeriod);
      pricingCache.set(cacheKey, {
        data: data.data,
        timestamp: Date.now(),
        billingPeriod,
      });

      setPricingTiers(data.data);
      setError(null);
      retryCountRef.current = 0;
      setIsStale(false);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }

      console.error('Error fetching pricing data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pricing plans';
      setError(errorMessage);

      // Retry logic
      if (enableRetry && retryCountRef.current < maxRetries && !isRetry) {
        retryCountRef.current++;
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000); // Exponential backoff, max 5s
        
        console.log(`Retrying pricing fetch in ${retryDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
        
        setTimeout(() => {
          fetchFromAPI(true);
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  }, [billingPeriod, enableRetry, maxRetries, getCacheKey, updatePerformanceMetrics]);

  const refetch = useCallback(async () => {
    // Clear cache for this billing period
    const cacheKey = getCacheKey(billingPeriod);
    pricingCache.delete(cacheKey);
    
    retryCountRef.current = 0;
    await fetchFromAPI();
  }, [billingPeriod, getCacheKey, fetchFromAPI]);

  // Main fetch logic
  const fetchPricingData = useCallback(async () => {
    requestStartTimeRef.current = Date.now();
    
    // Try cache first
    const cacheSuccess = fetchFromCache();
    
    if (!cacheSuccess) {
      await fetchFromAPI();
    }
  }, [fetchFromCache, fetchFromAPI]);

  // Effect to fetch data when billing period changes
  useEffect(() => {
    fetchPricingData();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPricingData]);

  // Effect to check for stale data and refresh in background
  useEffect(() => {
    if (isStale && !loading) {
      console.log('Refreshing stale pricing data in background');
      fetchFromAPI();
    }
  }, [isStale, loading, fetchFromAPI]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    pricingTiers,
    loading,
    error,
    refetch,
    isStale,
    cacheHit,
  };
};

// Utility functions for cache management
export const pricingCacheUtils = {
  // Clear all cached pricing data
  clearCache: () => {
    pricingCache.clear();
    console.log('Pricing cache cleared');
  },
  
  // Get cache statistics
  getCacheStats: () => ({
    size: pricingCache.size,
    entries: Array.from(pricingCache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      billingPeriod: entry.billingPeriod,
      itemCount: entry.data.length,
    })),
    performance: { ...performanceMetrics },
  }),
  
  // Preload pricing data for both billing periods
  preloadAll: async () => {
    const periods: ('monthly' | 'annual')[] = ['monthly', 'annual'];
    
    const preloadPromises = periods.map(async (period) => {
      try {
        const response = await fetch(`/api/plans?billing_period=${period}`);
        const data: PricingResponse = await response.json();
        
        if (data.success) {
          pricingCache.set(`pricing_${period}`, {
            data: data.data,
            timestamp: Date.now(),
            billingPeriod: period,
          });
        }
      } catch (error) {
        console.warn(`Failed to preload ${period} pricing:`, error);
      }
    });
    
    await Promise.allSettled(preloadPromises);
    console.log('Pricing data preloaded for all billing periods');
  },
  
  // Warm up cache on app initialization
  warmupCache: () => {
    // Only preload if we haven't already
    if (pricingCache.size === 0) {
      pricingCacheUtils.preloadAll();
    }
  },
};