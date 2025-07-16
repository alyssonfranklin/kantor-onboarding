// Payment and subscription related TypeScript types

export interface PricingTier {
  price_id: string;
  kantor_version: string;
  price_value: number;
  currency_id: string;
  billing_period: 'monthly' | 'annual';
  stripe_price_id?: string;
  features: string[];
  description: string;
  popular?: boolean;
  is_active: boolean;
}

export interface BillingPeriod {
  period: 'monthly' | 'annual';
  label: string;
  discount?: number; // Percentage discount for annual plans
}

export interface SubscriptionData {
  subscription_id: string;
  company_id: string;
  user_id: string;
  kantor_version: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trial' | 'incomplete';
  current_period_start: Date;
  current_period_end: Date;
  trial_start?: Date;
  trial_end?: Date;
  billing_period: 'monthly' | 'annual';
  amount: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentRecord {
  payment_id: string;
  subscription_id: string;
  company_id: string;
  user_id: string;
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled';
  payment_method: 'card' | 'paypal' | 'pix' | 'other';
  description: string;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CheckoutSessionRequest {
  priceId: string;
  kantor_version: string;
  billing_period: 'monthly' | 'annual';
  userId: string;
  companyId: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  url?: string;
  sessionId?: string;
  message?: string;
}

export interface PricingResponse {
  success: boolean;
  data: PricingTier[];
  message?: string;
}

export interface PaymentFormData {
  selectedPlan: PricingTier | null;
  billingPeriod: 'monthly' | 'annual';
  isProcessing: boolean;
  error: string | null;
}

export interface StripeSession {
  id: string;
  payment_status: string;
  customer_email?: string;
}

export interface SessionVerificationResponse {
  success: boolean;
  session: StripeSession;
  subscription: SubscriptionData;
  message?: string;
}

export interface PlanFeature {
  title: string;
  included: boolean;
  highlight?: boolean;
}

export interface PlanCard {
  tier: PricingTier;
  features: PlanFeature[];
  popular: boolean;
  buttonText: string;
  buttonVariant: 'default' | 'destructive' | 'outline' | 'secondary';
  onSelect: () => void;
  isLoading: boolean;
}

// Currency and formatting
export interface CurrencyFormat {
  code: string;
  symbol: string;
  position: 'before' | 'after';
  decimal_places: number;
}

// API Error types
export interface APIError {
  success: false;
  message: string;
  details?: string;
}

export interface APISuccess<T> {
  success: true;
  data: T;
  message?: string;
}