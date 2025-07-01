// Enhanced error handling for payment and subscription operations
// Following reference repository error handling patterns

export enum PaymentErrorType {
  // Stripe API Errors
  CARD_DECLINED = 'card_declined',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  EXPIRED_CARD = 'expired_card',
  INVALID_CVC = 'invalid_cvc',
  PROCESSING_ERROR = 'processing_error',
  
  // Subscription Errors
  SUBSCRIPTION_NOT_FOUND = 'subscription_not_found',
  ALREADY_SUBSCRIBED = 'already_subscribed',
  PLAN_NOT_FOUND = 'plan_not_found',
  TRIAL_ALREADY_USED = 'trial_already_used',
  
  // Authentication Errors
  UNAUTHORIZED = 'unauthorized',
  INVALID_TOKEN = 'invalid_token',
  SESSION_EXPIRED = 'session_expired',
  
  // Database Errors
  DATABASE_ERROR = 'database_error',
  CONNECTION_ERROR = 'connection_error',
  VALIDATION_ERROR = 'validation_error',
  
  // Network Errors
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  RATE_LIMITED = 'rate_limited',
  
  // Generic Errors
  UNKNOWN_ERROR = 'unknown_error',
  MAINTENANCE_MODE = 'maintenance_mode',
}

export interface PaymentError {
  type: PaymentErrorType;
  message: string;
  userMessage: string;
  code?: string;
  statusCode: number;
  retryable: boolean;
  metadata?: Record<string, any>;
}

// User-friendly error messages following the reference repo's UX patterns
const ERROR_MESSAGES: Record<PaymentErrorType, { message: string; userMessage: string; statusCode: number; retryable: boolean }> = {
  [PaymentErrorType.CARD_DECLINED]: {
    message: 'Card was declined',
    userMessage: 'Your card was declined. Please try a different payment method or contact your bank.',
    statusCode: 400,
    retryable: true,
  },
  [PaymentErrorType.INSUFFICIENT_FUNDS]: {
    message: 'Insufficient funds',
    userMessage: 'Your card has insufficient funds. Please try a different payment method.',
    statusCode: 400,
    retryable: true,
  },
  [PaymentErrorType.EXPIRED_CARD]: {
    message: 'Card has expired',
    userMessage: 'Your card has expired. Please update your payment method.',
    statusCode: 400,
    retryable: true,
  },
  [PaymentErrorType.INVALID_CVC]: {
    message: 'Invalid CVC code',
    userMessage: 'The security code (CVC) on your card is invalid. Please check and try again.',
    statusCode: 400,
    retryable: true,
  },
  [PaymentErrorType.PROCESSING_ERROR]: {
    message: 'Payment processing error',
    userMessage: 'There was an error processing your payment. Please try again in a few minutes.',
    statusCode: 500,
    retryable: true,
  },
  [PaymentErrorType.SUBSCRIPTION_NOT_FOUND]: {
    message: 'Subscription not found',
    userMessage: 'We couldn\'t find your subscription. Please contact support for assistance.',
    statusCode: 404,
    retryable: false,
  },
  [PaymentErrorType.ALREADY_SUBSCRIBED]: {
    message: 'User already has active subscription',
    userMessage: 'You already have an active subscription. Please cancel your current subscription before subscribing to a new plan.',
    statusCode: 409,
    retryable: false,
  },
  [PaymentErrorType.PLAN_NOT_FOUND]: {
    message: 'Subscription plan not found',
    userMessage: 'The selected plan is no longer available. Please choose a different plan.',
    statusCode: 404,
    retryable: false,
  },
  [PaymentErrorType.TRIAL_ALREADY_USED]: {
    message: 'Trial period already used',
    userMessage: 'You\'ve already used your free trial. Please select a paid plan to continue.',
    statusCode: 400,
    retryable: false,
  },
  [PaymentErrorType.UNAUTHORIZED]: {
    message: 'Unauthorized access',
    userMessage: 'Please log in to continue with your subscription.',
    statusCode: 401,
    retryable: false,
  },
  [PaymentErrorType.INVALID_TOKEN]: {
    message: 'Invalid authentication token',
    userMessage: 'Your session has expired. Please log in again.',
    statusCode: 401,
    retryable: false,
  },
  [PaymentErrorType.SESSION_EXPIRED]: {
    message: 'Session expired',
    userMessage: 'Your session has expired. Please log in again to continue.',
    statusCode: 401,
    retryable: false,
  },
  [PaymentErrorType.DATABASE_ERROR]: {
    message: 'Database operation failed',
    userMessage: 'We\'re experiencing technical difficulties. Please try again in a few minutes.',
    statusCode: 500,
    retryable: true,
  },
  [PaymentErrorType.CONNECTION_ERROR]: {
    message: 'Database connection failed',
    userMessage: 'We\'re experiencing technical difficulties. Please try again in a few minutes.',
    statusCode: 503,
    retryable: true,
  },
  [PaymentErrorType.VALIDATION_ERROR]: {
    message: 'Data validation failed',
    userMessage: 'Please check your information and try again.',
    statusCode: 400,
    retryable: false,
  },
  [PaymentErrorType.NETWORK_ERROR]: {
    message: 'Network request failed',
    userMessage: 'Connection error. Please check your internet connection and try again.',
    statusCode: 500,
    retryable: true,
  },
  [PaymentErrorType.TIMEOUT_ERROR]: {
    message: 'Request timeout',
    userMessage: 'The request timed out. Please try again.',
    statusCode: 408,
    retryable: true,
  },
  [PaymentErrorType.RATE_LIMITED]: {
    message: 'Rate limit exceeded',
    userMessage: 'Too many requests. Please wait a moment and try again.',
    statusCode: 429,
    retryable: true,
  },
  [PaymentErrorType.UNKNOWN_ERROR]: {
    message: 'Unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again or contact support.',
    statusCode: 500,
    retryable: true,
  },
  [PaymentErrorType.MAINTENANCE_MODE]: {
    message: 'Service in maintenance mode',
    userMessage: 'We\'re currently performing maintenance. Please try again in a few minutes.',
    statusCode: 503,
    retryable: true,
  },
};

export class PaymentErrorHandler {
  static createError(
    type: PaymentErrorType,
    code?: string,
    metadata?: Record<string, any>
  ): PaymentError {
    const errorConfig = ERROR_MESSAGES[type];
    
    return {
      type,
      code,
      metadata,
      ...errorConfig,
    };
  }

  static fromStripeError(stripeError: any): PaymentError {
    switch (stripeError.code) {
      case 'card_declined':
        return this.createError(PaymentErrorType.CARD_DECLINED, stripeError.code, {
          decline_code: stripeError.decline_code,
          charge_id: stripeError.charge,
        });
      
      case 'insufficient_funds':
        return this.createError(PaymentErrorType.INSUFFICIENT_FUNDS, stripeError.code);
      
      case 'expired_card':
        return this.createError(PaymentErrorType.EXPIRED_CARD, stripeError.code);
      
      case 'incorrect_cvc':
        return this.createError(PaymentErrorType.INVALID_CVC, stripeError.code);
      
      case 'processing_error':
        return this.createError(PaymentErrorType.PROCESSING_ERROR, stripeError.code);
      
      default:
        return this.createError(PaymentErrorType.PROCESSING_ERROR, stripeError.code, {
          stripe_error_type: stripeError.type,
          original_message: stripeError.message,
        });
    }
  }

  static fromDatabaseError(dbError: any): PaymentError {
    if (dbError.name === 'MongoNetworkError') {
      return this.createError(PaymentErrorType.CONNECTION_ERROR, dbError.code, {
        database_error: dbError.message,
      });
    }
    
    if (dbError.name === 'ValidationError') {
      return this.createError(PaymentErrorType.VALIDATION_ERROR, dbError.code, {
        validation_errors: dbError.errors,
      });
    }
    
    return this.createError(PaymentErrorType.DATABASE_ERROR, dbError.code, {
      database_error: dbError.message,
    });
  }

  static fromNetworkError(networkError: any): PaymentError {
    if (networkError.name === 'AbortError' || networkError.code === 'ECONNABORTED') {
      return this.createError(PaymentErrorType.TIMEOUT_ERROR, networkError.code);
    }
    
    return this.createError(PaymentErrorType.NETWORK_ERROR, networkError.code, {
      network_error: networkError.message,
    });
  }

  static isRetryable(error: PaymentError): boolean {
    return error.retryable;
  }

  static shouldRetryAfter(error: PaymentError): number {
    // Return retry delay in milliseconds
    switch (error.type) {
      case PaymentErrorType.RATE_LIMITED:
        return 60000; // 1 minute
      case PaymentErrorType.NETWORK_ERROR:
      case PaymentErrorType.TIMEOUT_ERROR:
        return 5000; // 5 seconds
      case PaymentErrorType.DATABASE_ERROR:
      case PaymentErrorType.CONNECTION_ERROR:
        return 10000; // 10 seconds
      default:
        return 0; // No retry
    }
  }

  static logError(error: PaymentError, context?: Record<string, any>): void {
    const logData = {
      type: error.type,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      retryable: error.retryable,
      metadata: error.metadata,
      context,
      timestamp: new Date().toISOString(),
    };

    // In production, this would integrate with your logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry, DataDog, CloudWatch, etc.
      console.error('[PAYMENT_ERROR]', JSON.stringify(logData));
    } else {
      console.error('[PAYMENT_ERROR]', logData);
    }
  }
}

// Retry utility following reference repo patterns
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: PaymentError | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error instanceof PaymentError 
          ? error 
          : PaymentErrorHandler.createError(PaymentErrorType.UNKNOWN_ERROR);
        
        if (!PaymentErrorHandler.isRetryable(lastError) || attempt === maxRetries) {
          throw lastError;
        }
        
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt - 1), // Exponential backoff
          30000 // Max 30 seconds
        );
        
        PaymentErrorHandler.logError(lastError, {
          attempt,
          maxRetries,
          retryDelay: delay,
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// Error boundary for React components
export function createErrorBoundary(fallbackComponent: React.ComponentType<{ error: PaymentError; retry: () => void }>) {
  return class PaymentErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: PaymentError | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { error: null };
    }

    static getDerivedStateFromError(error: any): { error: PaymentError } {
      const paymentError = error instanceof PaymentError 
        ? error 
        : PaymentErrorHandler.createError(PaymentErrorType.UNKNOWN_ERROR);
      
      PaymentErrorHandler.logError(paymentError, {
        component: 'PaymentErrorBoundary',
        stack: error.stack,
      });
      
      return { error: paymentError };
    }

    retry = () => {
      this.setState({ error: null });
    };

    render() {
      if (this.state.error) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return this.props.children;
    }
  };
}