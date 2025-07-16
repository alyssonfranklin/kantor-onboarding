'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Download, Mail, Calendar, CreditCard, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-skeleton';
import { SubscriptionAnalytics } from '@/lib/monitoring/subscription-analytics';

interface PaymentSuccessProps {
  sessionId?: string;
  onContinue?: () => void;
  onDownloadReceipt?: () => void;
}

interface SubscriptionDetails {
  planName: string;
  amount: number;
  currency: string;
  billingPeriod: 'monthly' | 'annual';
  trialEndDate?: Date;
  nextBillingDate?: Date;
  features: string[];
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  sessionId,
  onContinue,
  onDownloadReceipt,
}) => {
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(!!sessionId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/create-checkout-session?sessionId=${sessionId}`);
        const data = await response.json();

        if (data.success) {
          // Track successful subscription
          await SubscriptionAnalytics.trackEvent({
            type: 'payment_success',
            userId: 'user_id', // Replace with actual user ID
            companyId: 'company_id', // Replace with actual company ID
            amount: data.subscription?.amount,
            currency: data.subscription?.currency,
            planId: data.subscription?.planId,
            metadata: {
              session_id: sessionId,
              billing_period: data.subscription?.billingPeriod,
            },
            timestamp: new Date(),
          });

          setSubscriptionDetails(data.subscription);
        } else {
          setError(data.message || 'Failed to fetch subscription details');
        }
      } catch (err) {
        console.error('Error fetching subscription details:', err);
        setError('Failed to load subscription information');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [sessionId]);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your subscription details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-red-100 dark:bg-red-900 rounded-full p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button onClick={() => window.location.href = '/payment'}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Success Header */}
        <Card className="text-center overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-8">
            <div className="flex justify-center mb-4">
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <CheckCircle className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful! 🎉</h1>
            <p className="text-green-100 text-lg">
              Welcome to your new subscription
            </p>
          </div>
        </Card>

        {/* Subscription Details */}
        {subscriptionDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-500" />
                Subscription Details
              </CardTitle>
              <CardDescription>
                Your subscription is now active and ready to use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {subscriptionDetails.planName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatPrice(subscriptionDetails.amount, subscriptionDetails.currency)}
                      <span className="text-sm text-gray-500 ml-1">
                        /{subscriptionDetails.billingPeriod === 'annual' ? 'year' : 'month'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Trial Information */}
              {subscriptionDetails.trialEndDate && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Free Trial Active
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Your trial ends on {formatDate(subscriptionDetails.trialEndDate)}. 
                        You won't be charged until then.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">What's included:</h3>
                <ul className="space-y-2">
                  {subscriptionDetails.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={onDownloadReceipt}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Receipt
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.open('mailto:support@voxerion.com', '_blank')}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Contact Support
          </Button>

          <Button
            onClick={onContinue || (() => window.location.href = '/dashboard')}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white flex items-center gap-2"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Email Confirmation Notice */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardContent className="flex items-center gap-3 py-4">
            <Mail className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Confirmation email sent
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Check your inbox for subscription details and getting started guide
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Return Home Link */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/'}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;