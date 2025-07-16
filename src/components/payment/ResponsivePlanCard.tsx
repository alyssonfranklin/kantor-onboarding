'use client';

import React from 'react';
import { Check, Zap, Shield, Headphones, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingButton } from '@/components/ui/loading-skeleton';
import { PricingTier } from '@/types/payment';

interface ResponsivePlanCardProps {
  tier: PricingTier;
  isPopular?: boolean;
  isProcessing?: boolean;
  selectedPlanId?: string | null;
  billingPeriod: 'monthly' | 'annual';
  discount?: number;
  onSelect: (tier: PricingTier) => void;
  className?: string;
}

const featureIcons: Record<string, React.ReactNode> = {
  'Advanced': <Zap className="h-4 w-4 text-blue-500" />,
  'Priority': <Shield className="h-4 w-4 text-green-500" />,
  'Support': <Headphones className="h-4 w-4 text-purple-500" />,
  'default': <Check className="h-4 w-4 text-green-500" />,
};

const ResponsivePlanCard: React.FC<ResponsivePlanCardProps> = ({
  tier,
  isPopular = false,
  isProcessing = false,
  selectedPlanId,
  billingPeriod,
  discount = 0,
  onSelect,
  className = '',
}) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price / 100);
  };

  const getFeatureIcon = (feature: string) => {
    const firstWord = feature.split(' ')[0];
    return featureIcons[firstWord] || featureIcons.default;
  };

  const handleSelect = () => {
    onSelect(tier);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect();
    }
  };

  return (
    <Card 
      className={`
        relative transition-all duration-300 group cursor-pointer
        ${isPopular 
          ? 'border-orange-500 shadow-xl ring-2 ring-orange-500 ring-opacity-50 scale-[1.02] lg:scale-105' 
          : 'border-gray-200 hover:border-orange-300 hover:shadow-lg hover:scale-[1.01]'
        }
        ${className}
        /* Mobile-first responsive design */
        w-full
        /* Touch-friendly on mobile */
        touch-manipulation
        /* Improved accessibility */
        focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2
      `}
      role="button"
      tabIndex={0}
      aria-label={`Select ${tier.kantor_version} plan for ${formatPrice(tier.price_value, tier.currency_id)} per ${billingPeriod === 'monthly' ? 'month' : 'year'}`}
      onKeyDown={handleKeyDown}
      onClick={handleSelect}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
            <Star className="h-3 w-3" />
            Most Popular
          </div>
        </div>
      )}

      {/* Card Header */}
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {tier.kantor_version}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          {tier.description}
        </CardDescription>

        {/* Pricing */}
        <div className="mt-4 sm:mt-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(tier.price_value, tier.currency_id)}
            </span>
            <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
            </span>
          </div>
          
          {/* Annual Discount */}
          {billingPeriod === 'annual' && discount > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Save {discount}% annually
              </span>
            </div>
          )}
          
          {/* Monthly equivalent for annual plans */}
          {billingPeriod === 'annual' && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatPrice(tier.price_value / 12, tier.currency_id)}/month billed annually
            </div>
          )}
        </div>
      </CardHeader>

      {/* Features List */}
      <CardContent className="pb-4">
        <ul 
          className="space-y-3" 
          role="list" 
          aria-label={`${tier.kantor_version} plan features`}
        >
          {tier.features?.map((feature, index) => (
            <li 
              key={index} 
              className="flex items-start group-hover:translate-x-1 transition-transform duration-200"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getFeatureIcon(feature)}
              </div>
              <span className="text-gray-600 dark:text-gray-400 ml-3 text-sm leading-relaxed">
                {feature}
              </span>
            </li>
          )) || (
            <li className="text-gray-500 italic text-sm">Features loading...</li>
          )}
        </ul>
      </CardContent>

      {/* Action Button */}
      <CardFooter className="flex flex-col space-y-3 pt-0">
        <LoadingButton
          onClick={handleSelect}
          loading={isProcessing && selectedPlanId === tier.price_id}
          loadingText="Processing..."
          disabled={isProcessing}
          className={`
            w-full h-11 sm:h-12 text-sm sm:text-base font-semibold 
            transition-all duration-200 
            /* Touch-friendly sizing on mobile */
            min-h-[44px]
            ${isPopular 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
              : 'border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white bg-white dark:bg-gray-900 dark:hover:bg-orange-500'
            }
            /* Improved accessibility */
            focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
            /* Better mobile interaction */
            active:scale-95
          `}
          aria-describedby={`plan-${tier.price_id}-description`}
        >
          {isPopular ? 'Start Free Trial' : 'Choose Plan'}
        </LoadingButton>
        
        {/* Trial Information */}
        <div className="text-center space-y-1">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            ✨ 7-day free trial • No credit card required
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Cancel anytime during trial
          </p>
        </div>
      </CardFooter>

      {/* Screen Reader Only Description */}
      <div 
        id={`plan-${tier.price_id}-description`}
        className="sr-only"
      >
        {tier.kantor_version} plan includes {tier.features?.join(', ')} for {formatPrice(tier.price_value, tier.currency_id)} per {billingPeriod === 'monthly' ? 'month' : 'year'}.
      </div>
    </Card>
  );
};

export default ResponsivePlanCard;