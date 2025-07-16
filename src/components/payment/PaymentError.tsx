'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, CreditCard, HelpCircle, ArrowLeft, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentErrorHandler, PaymentErrorType } from '@/lib/errors/payment-errors';
import { SubscriptionAnalytics } from '@/lib/monitoring/subscription-analytics';

interface PaymentErrorProps {
  errorCode?: string;
  errorMessage?: string;
  sessionId?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onContactSupport?: () => void;
}

interface ErrorSolution {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const PaymentError: React.FC<PaymentErrorProps> = ({
  errorCode,
  errorMessage,
  sessionId,
  onRetry,
  onGoBack,
  onContactSupport,
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Track payment failure
    const trackError = async () => {
      await SubscriptionAnalytics.trackEvent({
        type: 'payment_failed',
        userId: 'user_id', // Replace with actual user ID
        companyId: 'company_id', // Replace with actual company ID
        metadata: {
          error_code: errorCode,
          error_message: errorMessage,
          session_id: sessionId,
          retry_count: retryCount,
        },
        timestamp: new Date(),
      });
    };

    trackError();
  }, [errorCode, errorMessage, sessionId, retryCount]);

  const getErrorDetails = () => {
    if (!errorCode && !errorMessage) {
      return {
        type: PaymentErrorType.UNKNOWN_ERROR,
        title: 'Payment Failed',
        description: 'An unexpected error occurred during payment processing.',
      };
    }

    // Map common Stripe error codes to user-friendly messages
    const errorMap: Record<string, { type: PaymentErrorType; title: string; description: string }> = {
      'card_declined': {
        type: PaymentErrorType.CARD_DECLINED,
        title: 'Card Declined',
        description: 'Your card was declined by your bank. Please try a different payment method.',
      },
      'insufficient_funds': {
        type: PaymentErrorType.INSUFFICIENT_FUNDS,
        title: 'Insufficient Funds',
        description: 'Your card has insufficient funds for this transaction.',
      },
      'expired_card': {
        type: PaymentErrorType.EXPIRED_CARD,
        title: 'Card Expired',
        description: 'Your card has expired. Please update your payment method.',
      },
      'incorrect_cvc': {
        type: PaymentErrorType.INVALID_CVC,
        title: 'Invalid Security Code',
        description: 'The security code (CVC) you entered is incorrect.',
      },
      'processing_error': {
        type: PaymentErrorType.PROCESSING_ERROR,
        title: 'Processing Error',
        description: 'There was an error processing your payment. Please try again.',
      },
      'authentication_required': {
        type: PaymentErrorType.PROCESSING_ERROR,
        title: 'Authentication Required',
        description: 'Your bank requires additional authentication for this payment.',
      },
    };

    const errorDetail = errorMap[errorCode || ''] || {
      type: PaymentErrorType.UNKNOWN_ERROR,
      title: 'Payment Error',
      description: errorMessage || 'An error occurred while processing your payment.',
    };

    return errorDetail;
  };

  const getSolutions = (): ErrorSolution[] => {
    const errorDetail = getErrorDetails();
    
    const commonSolutions: ErrorSolution[] = [
      {
        title: 'Try a different payment method',
        description: 'Use another credit card, debit card, or payment method.',
        action: {
          label: 'Update Payment Method',
          onClick: () => window.location.href = '/payment',
        },
      },
      {
        title: 'Contact your bank',
        description: 'Your bank may have declined the transaction for security reasons.',
      },
      {
        title: 'Check your card details',
        description: 'Ensure your card number, expiry date, and security code are correct.',
      },
    ];

    const specificSolutions: Record<PaymentErrorType, ErrorSolution[]> = {
      [PaymentErrorType.CARD_DECLINED]: [
        {
          title: 'Contact your bank',
          description: 'Your bank has declined this transaction. Contact them to authorize the payment.',
          action: {
            label: 'Find Bank Contact',
            onClick: () => window.open('https://www.google.com/search?q=bank+contact+number', '_blank'),
          },
        },
        ...commonSolutions.slice(0, 1),
      ],
      [PaymentErrorType.INSUFFICIENT_FUNDS]: [
        {
          title: 'Add funds to your account',
          description: 'Ensure you have sufficient funds in your account for this transaction.',
        },
        ...commonSolutions.slice(0, 1),
      ],
      [PaymentErrorType.EXPIRED_CARD]: [
        {
          title: 'Update your card information',
          description: 'Your card has expired. Please use a current, valid payment method.',
          action: {
            label: 'Update Card',
            onClick: () => window.location.href = '/payment',
          },
        },
      ],
      [PaymentErrorType.INVALID_CVC]: [
        {
          title: 'Check your security code',
          description: 'The 3-4 digit code on the back (or front for Amex) of your card.',
          action: {
            label: 'Try Again',
            onClick: handleRetry,
          },
        },
      ],
      [PaymentErrorType.PROCESSING_ERROR]: commonSolutions,
      [PaymentErrorType.UNKNOWN_ERROR]: commonSolutions,
    };

    return specificSolutions[errorDetail.type] || commonSolutions;
  };

  async function handleRetry() {
    if (isRetrying) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      // Track retry attempt
      await SubscriptionAnalytics.trackEvent({
        type: 'payment_failed',
        userId: 'user_id',
        companyId: 'company_id',
        metadata: {
          action: 'retry_payment',
          retry_count: retryCount + 1,
          original_error: errorCode,
        },
        timestamp: new Date(),
      });

      if (onRetry) {
        onRetry();
      } else {
        window.location.href = '/payment';
      }
    } catch (error) {
      console.error('Error during retry:', error);
    } finally {
      setTimeout(() => setIsRetrying(false), 1000);
    }
  }

  const errorDetail = getErrorDetails();
  const solutions = getSolutions();
  const canRetry = retryCount < 3 && PaymentErrorHandler.isRetryable(
    PaymentErrorHandler.createError(errorDetail.type)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Error Header */}
        <Card className="text-center overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-8">
            <div className="flex justify-center mb-4">
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <AlertCircle className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">{errorDetail.title}</h1>
            <p className="text-red-100 text-lg max-w-md mx-auto">
              {errorDetail.description}
            </p>
          </div>
        </Card>

        {/* Error Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-red-500" />
              What happened?
            </CardTitle>
            <CardDescription>
              Don't worry, this is a common issue that can usually be resolved quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorCode && (
              <Alert className="mb-4">
                <HelpCircle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">Error Code:</span> {errorCode}
                  {errorMessage && (
                    <span className="block mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {errorMessage}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                How to resolve this:
              </h3>
              <div className="grid gap-4">
                {solutions.map((solution, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mt-1">
                      <span className="block w-4 h-4 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {solution.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {solution.description}
                      </p>
                      {solution.action && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={solution.action.onClick}
                          className="text-xs"
                        >
                          {solution.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={onGoBack || (() => window.history.back())}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>

          {canRetry && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Try Again ({3 - retryCount} left)
                </>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={onContactSupport || (() => window.open('mailto:support@voxerion.com', '_blank'))}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Contact Support
          </Button>
        </div>

        {/* Support Information */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardContent className="py-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
              Need immediate help?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Email Support</p>
                  <p className="text-blue-700 dark:text-blue-300">support@voxerion.com</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Live Chat</p>
                  <p className="text-blue-700 dark:text-blue-300">Available 9 AM - 6 PM EST</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          🔒 Your payment information is secure and encrypted. We never store your card details.
        </div>
      </div>
    </div>
  );
};

export default PaymentError;