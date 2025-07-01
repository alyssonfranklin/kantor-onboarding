'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks';
import { Check, AlertCircle, ArrowRight } from 'lucide-react';
import ModalLoader from '@/components/client/ModalLoader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePayment } from '@/hooks/usePayment';
import { SubscriptionData } from '@/types/payment';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { verifyPayment } = usePayment();
  const [loading, setLoading] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      handlePaymentVerification(sessionId);
    } else {
      setError('Missing session information');
      setLoading(false);
    }
  }, [searchParams, verifyPayment]);

  const handlePaymentVerification = async (sessionId: string) => {
    try {
      const result = await verifyPayment(sessionId);
      
      if (result.success) {
        setSubscriptionDetails(result.subscription);
      } else {
        setError(result.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError('Error verifying payment');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleStartOnboarding = () => {
    router.push('/dashboard/onboarding');
  };

  const handleRetryPayment = () => {
    router.push('/payment');
  };

  if (loading) {
    return <ModalLoader message="Verifying your payment..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Payment Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleRetryPayment}
              className="w-full bg-primary-500 hover:bg-primary-600"
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600" />
          </div>

          <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Voxerion!
          </CardTitle>
          <p className="text-lg text-gray-600">
            Your subscription has been successfully activated. You can now access all the features of your plan.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Subscription Details */}
          {subscriptionDetails && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium text-gray-900">{subscriptionDetails.kantor_version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600 capitalize">{subscriptionDetails.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing:</span>
                  <span className="font-medium text-gray-900 capitalize">{subscriptionDetails.billing_period}</span>
                </div>
                {subscriptionDetails.trial_end && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trial ends:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(subscriptionDetails.trial_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trial Information */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="font-medium mb-1">7-Day Free Trial</div>
              <div className="text-sm text-blue-700">
                You won't be charged until your trial period ends. Cancel anytime during the trial at no cost.
              </div>
            </AlertDescription>
          </Alert>

          {/* Next Steps */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Access your dashboard and explore all features</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Set up your team and start the onboarding process</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Configure your organizational insights and analytics</span>
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {/* Action Buttons */}
          <div className="flex space-x-4 w-full">
            <Button
              onClick={handleGoToDashboard}
              className="flex-1 bg-primary-500 hover:bg-primary-600"
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={handleStartOnboarding}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Start Onboarding
            </Button>
          </div>

          {/* Support */}
          <p className="text-sm text-gray-500 text-center">
            Need help?{' '}
            <a 
              href="mailto:support@voxerion.com" 
              className="text-primary-600 hover:text-primary-700 underline"
            >
              Contact our support team
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<ModalLoader message="Loading payment details..." />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}