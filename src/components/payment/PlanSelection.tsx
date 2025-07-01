'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Loader2, AlertCircle, RefreshCw, Zap, Shield, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlanCardSkeleton, LoadingButton } from '@/components/ui/loading-skeleton';
import { PricingTier, PricingResponse, BillingPeriod } from '@/types/payment';
import { SubscriptionAnalytics } from '@/lib/monitoring/subscription-analytics';

interface PlanSelectionProps {
  onPlanSelect: (tier: PricingTier) => void;
  isProcessing: boolean;
  error: string | null;
}

interface FeatureIcon {
  [key: string]: React.ReactNode;
}

const featureIcons: FeatureIcon = {
  'Advanced': <Zap className="h-4 w-4 text-blue-500" />,
  'Priority': <Shield className="h-4 w-4 text-green-500" />,
  'Support': <Headphones className="h-4 w-4 text-purple-500" />,
  'default': <Check className="h-4 w-4 text-green-500" />,
};

const PlanSelection: React.FC<PlanSelectionProps> = ({ 
  onPlanSelect, 
  isProcessing, 
  error 
}) => {
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const billingPeriods: BillingPeriod[] = [
    { period: 'monthly', label: 'Monthly' },
    { period: 'annual', label: 'Annual', discount: 20 }
  ];

  const fetchPricingTiers = useCallback(async (isRetry = false) => {
    try {
      setLoading(!isRetry); // Don't show full loading on retry
      setFetchError(null);
      
      // Track analytics
      if (!isRetry) {
        await SubscriptionAnalytics.trackEvent({
          type: 'subscription_created',
          userId: 'anonymous',
          companyId: 'anonymous',
          metadata: {
            action: 'view_pricing',
            billing_period: billingPeriod,
          },
          timestamp: new Date(),
        });
      }
      
      const response = await fetch(`/api/plans?billing_period=${billingPeriod}`, {
        headers: {
          'Cache-Control': 'max-age=300', // Cache for 5 minutes
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: PricingResponse = await response.json();
      
      if (data.success) {
        setPricingTiers(data.data);
        setRetryCount(0);
      } else {
        throw new Error(data.message || 'Failed to load pricing tiers');
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error loading pricing information';
      setFetchError(errorMessage);
      
      // Auto-retry logic for network errors
      if (retryCount < 2 && !isRetry) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchPricingTiers(true);
        }, 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  }, [billingPeriod, retryCount]);

  useEffect(() => {
    fetchPricingTiers();
  }, [fetchPricingTiers]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price / 100); // Stripe amounts are in cents
  };

  const getAnnualDiscount = (tier: PricingTier) => {
    const monthlyTier = pricingTiers.find(t => 
      t.kantor_version === tier.kantor_version && t.billing_period === 'monthly'
    );
    
    if (monthlyTier && tier.billing_period === 'annual') {
      const monthlyTotal = monthlyTier.price_value * 12;
      const discount = ((monthlyTotal - tier.price_value) / monthlyTotal) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const handleBillingPeriodChange = async (period: 'monthly' | 'annual') => {
    // Track billing period change
    await SubscriptionAnalytics.trackEvent({
      type: 'subscription_created',
      userId: 'anonymous',
      companyId: 'anonymous',
      metadata: {
        action: 'billing_period_change',
        from: billingPeriod,
        to: period,
      },
      timestamp: new Date(),
    });
    
    setBillingPeriod(period);
    setRetryCount(0); // Reset retry count on manual change
  };

  const handlePlanSelect = async (tier: PricingTier) => {
    setSelectedPlanId(tier.price_id);
    
    // Track plan selection
    await SubscriptionAnalytics.trackEvent({
      type: 'subscription_created',
      userId: 'anonymous',
      companyId: 'anonymous',
      planId: tier.kantor_version,
      amount: tier.price_value,
      currency: tier.currency_id,
      metadata: {
        action: 'plan_selected',
        billing_period: tier.billing_period,
        plan_name: tier.kantor_version,
      },
      timestamp: new Date(),
    });
    
    onPlanSelect(tier);
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchPricingTiers();
  };

  const getFeatureIcon = (feature: string) => {
    const firstWord = feature.split(' ')[0];
    return featureIcons[firstWord] || featureIcons.default;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded mx-auto mb-4 animate-pulse" />
          <div className="h-6 w-96 bg-gray-200 dark:bg-gray-800 rounded mx-auto mb-8 animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mx-auto animate-pulse" />
        </div>
        <PlanCardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Select the perfect plan for your organization's needs
        </p>

        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => handleBillingPeriodChange(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              billingPeriod === 'annual' ? 'bg-primary-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                billingPeriod === 'annual' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
            Annual
            <span className="ml-1 text-xs text-green-600 font-semibold">Save up to 20%</span>
          </span>
        </div>
      </div>

      {/* Error Messages */}
      {(error || fetchError) && (
        <div className="max-w-2xl mx-auto mb-8">
          <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span>{error || fetchError}</span>
                {fetchError && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetry}
                    className="border-red-300 text-red-700 hover:bg-red-100 self-start sm:self-center"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {pricingTiers.map((tier) => {
          const discount = getAnnualDiscount(tier);
          const isPopular = tier.popular || tier.kantor_version.toLowerCase().includes('business');
          
          return (
            <Card 
              key={tier.price_id}
              className={`relative transition-all duration-200 hover:shadow-xl group cursor-pointer ${
                isPopular 
                  ? 'border-orange-500 shadow-lg ring-1 ring-orange-500 scale-105' 
                  : 'border-gray-200 hover:border-orange-300 hover:shadow-lg'
              }`}
              role="button"
              tabIndex={0}
              aria-label={`Select ${tier.kantor_version} plan for ${formatPrice(tier.price_value, tier.currency_id)} per ${billingPeriod === 'monthly' ? 'month' : 'year'}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePlanSelect(tier);
                }
              }}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {tier.kantor_version}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {tier.description}
                </CardDescription>

                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(tier.price_value, tier.currency_id)}
                  </span>
                  <span className="text-gray-600 ml-2">
                    /{billingPeriod === 'monthly' ? 'month' : 'year'}
                  </span>
                  {billingPeriod === 'annual' && discount > 0 && (
                    <div className="text-sm text-green-600 font-medium mt-1">
                      Save {discount}% annually
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3" role="list" aria-label={`${tier.kantor_version} plan features`}>
                  {tier.features?.map((feature, index) => (
                    <li key={index} className="flex items-start group-hover:translate-x-1 transition-transform duration-200">
                      {getFeatureIcon(feature)}
                      <span className="text-gray-600 ml-3 text-sm leading-relaxed">{feature}</span>
                    </li>
                  )) || (
                    <li className="text-gray-500 italic">Features loading...</li>
                  )}
                </ul>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <LoadingButton
                  onClick={() => handlePlanSelect(tier)}
                  loading={isProcessing && selectedPlanId === tier.price_id}
                  loadingText="Processing..."
                  disabled={isProcessing}
                  className={`w-full h-12 text-base font-semibold transition-all duration-200 ${
                    isPopular 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl' 
                      : 'border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white bg-white'
                  }`}
                  aria-describedby={`plan-${tier.price_id}-description`}
                >
                  {isPopular ? 'Start Free Trial' : 'Choose Plan'}
                </LoadingButton>
                
                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-500">
                    ✨ 7-day free trial • No credit card required
                  </p>
                  <p className="text-xs text-gray-400">
                    Cancel anytime during trial
                  </p>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Trust Indicators */}
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Trusted by organizations worldwide
        </p>
        <div className="flex justify-center items-center space-x-8 opacity-60">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔒</span>
            <span className="text-sm text-gray-500">SSL Secured</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">💳</span>
            <span className="text-sm text-gray-500">Stripe Payments</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">✨</span>
            <span className="text-sm text-gray-500">7-Day Trial</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;