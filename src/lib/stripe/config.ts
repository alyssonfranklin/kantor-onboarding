import Stripe from 'stripe';

// Validate environment variables
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
} as const;

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`${key} is not set in environment variables`);
  }
}

// Initialize Stripe with error handling
export const stripe = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
  maxNetworkRetries: 3,
  timeout: 10000, // 10 seconds
  telemetry: false, // Disable telemetry for privacy
  appInfo: {
    name: 'Voxerion Kantor Onboarding',
    version: '1.0.0',
  },
});

export const STRIPE_CONFIG = {
  publishableKey: requiredEnvVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  webhookSecret: requiredEnvVars.STRIPE_WEBHOOK_SECRET,
  currency: 'usd',
  trialPeriodDays: 7,
  successUrl: `${requiredEnvVars.NEXT_PUBLIC_DOMAIN}/payment/success`,
  cancelUrl: `${requiredEnvVars.NEXT_PUBLIC_DOMAIN}/payment`,
  // Additional configuration
  defaultLocale: 'en',
  allowedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BR'],
  paymentMethods: ['card', 'paypal', 'pix'] as const,
  features: {
    allowPromotionCodes: true,
    collectBillingAddress: true,
    collectPhoneNumber: true,
    automaticTax: false,
  },
} as const;

// Type definitions for better TypeScript support
export type StripePaymentMethod = typeof STRIPE_CONFIG.paymentMethods[number];
export type StripeCurrency = 'usd' | 'eur' | 'gbp' | 'brl';

// Helper functions
export const formatAmount = (amount: number, currency: StripeCurrency = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

export const isValidWebhookSignature = (payload: string, signature: string): boolean => {
  try {
    stripe.webhooks.constructEvent(payload, signature, STRIPE_CONFIG.webhookSecret);
    return true;
  } catch (error) {
    console.error('Invalid webhook signature:', error);
    return false;
  }
};

// Stripe error handler utility
export const handleStripeError = (error: any): { message: string; code?: string; statusCode: number } => {
  if (error.type === 'StripeCardError') {
    return {
      message: error.message || 'Your card was declined.',
      code: error.code,
      statusCode: 400,
    };
  } else if (error.type === 'StripeRateLimitError') {
    return {
      message: 'Too many requests made to the API too quickly.',
      statusCode: 429,
    };
  } else if (error.type === 'StripeInvalidRequestError') {
    return {
      message: 'Invalid parameters were supplied to Stripe\'s API.',
      statusCode: 400,
    };
  } else if (error.type === 'StripeAPIError') {
    return {
      message: 'An error occurred with our API. Please try again.',
      statusCode: 500,
    };
  } else if (error.type === 'StripeConnectionError') {
    return {
      message: 'A network error occurred. Please try again.',
      statusCode: 500,
    };
  } else if (error.type === 'StripeAuthenticationError') {
    return {
      message: 'Authentication with Stripe\'s API failed.',
      statusCode: 401,
    };
  } else {
    return {
      message: 'An unexpected error occurred. Please try again.',
      statusCode: 500,
    };
  }
};