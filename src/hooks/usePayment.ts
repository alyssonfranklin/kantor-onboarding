'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks';
import { 
  PricingTier, 
  CheckoutSessionRequest, 
  CheckoutSessionResponse, 
  PaymentFormData 
} from '@/types/payment';
import { SubscriptionAnalytics } from '@/lib/monitoring/subscription-analytics';
import { PaymentErrorHandler, PaymentErrorType } from '@/lib/errors/payment-errors';

interface AccessibilityState {
  announcements: string[];
  focusTarget: string | null;
  screenReaderStatus: string | null;
}

export const usePayment = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [paymentState, setPaymentState] = useState<PaymentFormData>({
    selectedPlan: null,
    billingPeriod: 'monthly',
    isProcessing: false,
    error: null
  });

  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    announcements: [],
    focusTarget: null,
    screenReaderStatus: null,
  });

  // Refs for accessibility
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const lastSelectedPlanRef = useRef<PricingTier | null>(null);

  // Accessibility helpers
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAccessibilityState(prev => ({
      ...prev,
      announcements: [...prev.announcements, message],
      screenReaderStatus: message,
    }));

    // Clear announcement after it's been read
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }
    
    announcementTimeoutRef.current = setTimeout(() => {
      setAccessibilityState(prev => ({
        ...prev,
        screenReaderStatus: null,
      }));
    }, 3000);
  }, []);

  const setFocusTarget = useCallback((target: string | null) => {
    setAccessibilityState(prev => ({
      ...prev,
      focusTarget: target,
    }));
  }, []);

  const updatePaymentState = useCallback((updates: Partial<PaymentFormData>) => {
    setPaymentState(prev => ({ ...prev, ...updates }));
    
    // Announce state changes to screen readers
    if (updates.isProcessing !== undefined) {
      if (updates.isProcessing) {
        announceToScreenReader('Processing payment, please wait...', 'assertive');
      } else {
        announceToScreenReader('Payment processing completed');
      }
    }
    
    if (updates.error) {
      announceToScreenReader(`Error: ${updates.error}`, 'assertive');
      setFocusTarget('error-message');
    }
  }, [announceToScreenReader, setFocusTarget]);

  const clearError = useCallback(() => {
    updatePaymentState({ error: null });
    announceToScreenReader('Error cleared');
  }, [updatePaymentState, announceToScreenReader]);

  const setBillingPeriod = useCallback((period: 'monthly' | 'annual') => {
    updatePaymentState({ billingPeriod: period });
  }, [updatePaymentState]);

  const handleFreePlan = useCallback(async (tier: PricingTier) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      updatePaymentState({ isProcessing: true, error: null });

      // For free plans, just update the user's subscription locally
      // This could be an API call to set the free plan
      const response = await fetch('/api/v1/subscriptions/free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kantor_version: tier.kantor_version,
          companyId: user.company_id,
          userId: user.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to dashboard with success message
        router.push('/dashboard?subscription=activated');
      } else {
        updatePaymentState({ 
          error: data.message || 'Failed to activate free plan' 
        });
      }
    } catch (error) {
      console.error('Error activating free plan:', error);
      updatePaymentState({ 
        error: 'An error occurred while activating your free plan' 
      });
    } finally {
      updatePaymentState({ isProcessing: false });
    }
  }, [user, router, updatePaymentState]);

  const createCheckoutSession = useCallback(async (tier: PricingTier) => {
    if (!user) {
      announceToScreenReader('Please log in to continue with payment', 'assertive');
      router.push('/login');
      return;
    }

    if (!tier.stripe_price_id) {
      const error = PaymentErrorHandler.createError(PaymentErrorType.PLAN_NOT_FOUND);
      updatePaymentState({ error: error.userMessage });
      return;
    }

    try {
      lastSelectedPlanRef.current = tier;
      updatePaymentState({ 
        isProcessing: true, 
        error: null, 
        selectedPlan: tier 
      });

      // Track checkout attempt
      await SubscriptionAnalytics.trackEvent({
        type: 'subscription_created',
        userId: user.id,
        companyId: user.company_id,
        planId: tier.kantor_version,
        amount: tier.price_value,
        currency: tier.currency_id,
        metadata: {
          action: 'checkout_started',
          billing_period: tier.billing_period,
          retry_count: retryCountRef.current,
        },
        timestamp: new Date(),
      });

      const checkoutData: CheckoutSessionRequest = {
        priceId: tier.stripe_price_id,
        planId: tier.kantor_version,
        billingPeriod: tier.billing_period,
      };

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: CheckoutSessionResponse = await response.json();

      if (data.success && data.url) {
        // Track successful checkout session creation
        await SubscriptionAnalytics.trackEvent({
          type: 'subscription_created',
          userId: user.id,
          companyId: user.company_id,
          planId: tier.kantor_version,
          metadata: {
            action: 'checkout_session_created',
            session_id: data.sessionId,
          },
          timestamp: new Date(),
        });

        announceToScreenReader('Redirecting to secure payment page...', 'assertive');
        
        // Small delay to ensure screen reader announcement
        setTimeout(() => {
          window.location.href = data.url!;
        }, 500);
      } else {
        throw new Error(data.message || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      
      let paymentError;
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          paymentError = PaymentErrorHandler.fromNetworkError(error);
        } else {
          paymentError = PaymentErrorHandler.createError(PaymentErrorType.PROCESSING_ERROR);
        }
      } else {
        paymentError = PaymentErrorHandler.createError(PaymentErrorType.UNKNOWN_ERROR);
      }

      PaymentErrorHandler.logError(paymentError, {
        userId: user.id,
        planId: tier.kantor_version,
        retryCount: retryCountRef.current,
      });

      updatePaymentState({ error: paymentError.userMessage });

      // Auto-retry for retryable errors
      if (PaymentErrorHandler.isRetryable(paymentError) && retryCountRef.current < 2) {
        const retryDelay = PaymentErrorHandler.shouldRetryAfter(paymentError);
        if (retryDelay > 0) {
          retryCountRef.current++;
          announceToScreenReader(`Retrying payment in ${retryDelay / 1000} seconds...`);
          
          setTimeout(() => {
            createCheckoutSession(tier);
          }, retryDelay);
        }
      }
    } finally {
      // Don't set isProcessing to false here since we might be redirecting
      // Only set it to false if there was an error
      if (paymentState.error) {
        updatePaymentState({ isProcessing: false });
      }
    }
  }, [user, router, updatePaymentState, announceToScreenReader, paymentState.error]);

  const handlePlanSelection = useCallback(async (tier: PricingTier) => {
    clearError();
    retryCountRef.current = 0; // Reset retry count for new selection

    announceToScreenReader(`Selected ${tier.kantor_version} plan`);

    // Check if it's a free plan
    if (tier.price_value === 0) {
      await handleFreePlan(tier);
    } else {
      await createCheckoutSession(tier);
    }
  }, [clearError, handleFreePlan, createCheckoutSession, announceToScreenReader]);

  const verifyPayment = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/v1/stripe/verify-session?session_id=${sessionId}`);
      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          subscription: data.subscription,
          session: data.session
        };
      } else {
        return {
          success: false,
          error: data.message || 'Payment verification failed'
        };
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        error: 'Error verifying payment'
      };
    }
  }, []);

  const retryPayment = useCallback(() => {
    retryCountRef.current = 0;
    updatePaymentState({ 
      isProcessing: false, 
      error: null, 
      selectedPlan: null 
    });
    announceToScreenReader('Payment form reset, ready to try again');
    setFocusTarget('plan-selection');
  }, [updatePaymentState, announceToScreenReader, setFocusTarget]);

  // Enhanced retry with last selected plan
  const retryLastPayment = useCallback(() => {
    if (lastSelectedPlanRef.current) {
      retryCountRef.current++;
      announceToScreenReader(`Retrying payment for ${lastSelectedPlanRef.current.kantor_version} plan`, 'assertive');
      createCheckoutSession(lastSelectedPlanRef.current);
    } else {
      retryPayment();
    }
  }, [createCheckoutSession, retryPayment, announceToScreenReader]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    paymentState,
    accessibilityState,
    
    // Actions
    handlePlanSelection,
    setBillingPeriod,
    clearError,
    retryPayment,
    retryLastPayment,
    verifyPayment,
    
    // Accessibility helpers
    announceToScreenReader,
    setFocusTarget,
    
    // Computed values
    isProcessing: paymentState.isProcessing,
    error: paymentState.error,
    selectedPlan: paymentState.selectedPlan,
    billingPeriod: paymentState.billingPeriod,
    canRetry: retryCountRef.current < 3,
    retryCount: retryCountRef.current,
    
    // Accessibility values
    screenReaderStatus: accessibilityState.screenReaderStatus,
    focusTarget: accessibilityState.focusTarget,
  };
};