// Subscription analytics and monitoring system
// Following reference repository monitoring patterns

import { dbConnect } from '@/lib/mongodb/connect';
import SubscriptionHistory from '@/lib/mongodb/models/subscription-history.model';
import User from '@/lib/mongodb/models/user.model';
import Subscription from '@/lib/mongodb/models/subscription.model';

export interface SubscriptionMetrics {
  // Revenue metrics
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  
  // Subscription metrics
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  canceledSubscriptions: number;
  
  // Growth metrics
  newSubscriptionsThisMonth: number;
  cancelationsThisMonth: number;
  churnRate: number;
  growthRate: number;
  
  // Trial metrics
  trialConversionRate: number;
  averageTrialDuration: number;
  trialsEndingSoon: number;
  
  // Payment metrics
  successfulPayments: number;
  failedPayments: number;
  paymentFailureRate: number;
  
  // Plan distribution
  planDistribution: Record<string, number>;
  billingPeriodDistribution: Record<string, number>;
}

export interface PaymentEvent {
  type: 'payment_success' | 'payment_failure' | 'subscription_created' | 'subscription_canceled' | 'trial_started' | 'trial_converted';
  userId: string;
  companyId: string;
  amount?: number;
  currency?: string;
  planId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class SubscriptionAnalytics {
  // Track payment and subscription events
  static async trackEvent(event: PaymentEvent): Promise<void> {
    try {
      // Log to analytics service (e.g., Google Analytics, Mixpanel, etc.)
      if (process.env.NODE_ENV === 'production') {
        await this.sendToAnalytics(event);
      }
      
      // Log for debugging
      console.log('[ANALYTICS]', event);
      
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  private static async sendToAnalytics(event: PaymentEvent): Promise<void> {
    // Example: Google Analytics 4 Event
    if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      try {
        // This would integrate with your analytics service
        await fetch('https://www.google-analytics.com/mp/collect', {
          method: 'POST',
          body: JSON.stringify({
            client_id: event.userId,
            events: [{
              name: event.type,
              parameters: {
                value: event.amount ? event.amount / 100 : undefined,
                currency: event.currency,
                plan_id: event.planId,
                ...event.metadata,
              },
            }],
          }),
        });
      } catch (error) {
        console.error('Error sending to Google Analytics:', error);
      }
    }
  }

  // Get comprehensive subscription metrics
  static async getSubscriptionMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<SubscriptionMetrics> {
    try {
      await dbConnect();

      const now = new Date();
      const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endDate || now;

      // Get all subscription data
      const [
        subscriptions,
        subscriptionHistory,
        users,
      ] = await Promise.all([
        Subscription.find({}).lean(),
        SubscriptionHistory.find({
          created_at: { $gte: start, $lte: end }
        }).lean(),
        User.find({}).lean(),
      ]);

      // Calculate metrics
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
      const trialSubscriptions = subscriptions.filter(s => s.status === 'trial').length;
      const canceledSubscriptions = subscriptions.filter(s => s.status === 'canceled').length;

      // Revenue calculations
      const activeRevenue = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const monthlyRecurringRevenue = subscriptions
        .filter(s => s.status === 'active' && s.billing_period === 'monthly')
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const annualRecurringRevenue = subscriptions
        .filter(s => s.status === 'active' && s.billing_period === 'annual')
        .reduce((sum, s) => sum + (s.amount || 0), 0) / 12; // Convert to monthly

      // Growth metrics
      const newSubscriptionsThisMonth = subscriptionHistory
        .filter(h => h.action === 'created' && h.created_at >= start)
        .length;

      const cancelationsThisMonth = subscriptionHistory
        .filter(h => h.action === 'canceled' && h.created_at >= start)
        .length;

      // Trial metrics
      const trialConversions = subscriptionHistory
        .filter(h => h.action === 'trial_converted')
        .length;

      const totalTrialsStarted = subscriptionHistory
        .filter(h => h.action === 'trial_started')
        .length;

      // Payment metrics
      const successfulPayments = subscriptionHistory
        .filter(h => h.action === 'payment_succeeded')
        .length;

      const failedPayments = subscriptionHistory
        .filter(h => h.action === 'payment_failed')
        .length;

      // Plan distribution
      const planDistribution: Record<string, number> = {};
      subscriptions
        .filter(s => s.status === 'active')
        .forEach(s => {
          planDistribution[s.kantor_version] = (planDistribution[s.kantor_version] || 0) + 1;
        });

      // Billing period distribution
      const billingPeriodDistribution: Record<string, number> = {};
      subscriptions
        .filter(s => s.status === 'active')
        .forEach(s => {
          billingPeriodDistribution[s.billing_period] = (billingPeriodDistribution[s.billing_period] || 0) + 1;
        });

      return {
        totalRevenue: activeRevenue / 100, // Convert from cents
        monthlyRecurringRevenue: (monthlyRecurringRevenue + annualRecurringRevenue) / 100,
        annualRecurringRevenue: annualRecurringRevenue * 12 / 100,
        averageRevenuePerUser: activeSubscriptions > 0 ? (activeRevenue / activeSubscriptions) / 100 : 0,
        
        totalSubscriptions: subscriptions.length,
        activeSubscriptions,
        trialSubscriptions,
        canceledSubscriptions,
        
        newSubscriptionsThisMonth,
        cancelationsThisMonth,
        churnRate: activeSubscriptions > 0 ? (cancelationsThisMonth / activeSubscriptions) * 100 : 0,
        growthRate: activeSubscriptions > 0 ? ((newSubscriptionsThisMonth - cancelationsThisMonth) / activeSubscriptions) * 100 : 0,
        
        trialConversionRate: totalTrialsStarted > 0 ? (trialConversions / totalTrialsStarted) * 100 : 0,
        averageTrialDuration: 7, // Default trial period
        trialsEndingSoon: this.getTrialsEndingSoon(users),
        
        successfulPayments,
        failedPayments,
        paymentFailureRate: (successfulPayments + failedPayments) > 0 ? (failedPayments / (successfulPayments + failedPayments)) * 100 : 0,
        
        planDistribution,
        billingPeriodDistribution,
      };

    } catch (error) {
      console.error('Error calculating subscription metrics:', error);
      throw error;
    }
  }

  private static getTrialsEndingSoon(users: any[]): number {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    return users.filter(user => 
      user.subscription_status === 'trial' &&
      user.trial_end_date &&
      user.trial_end_date <= threeDaysFromNow &&
      user.trial_end_date > now
    ).length;
  }

  // Performance monitoring for database queries
  static async monitorQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFunction();
      const duration = Date.now() - startTime;
      
      if (process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
        console.log(`[QUERY_PERFORMANCE] ${queryName}: ${duration}ms`);
        
        // Log slow queries
        if (duration > 1000) {
          console.warn(`[SLOW_QUERY] ${queryName} took ${duration}ms`);
        }
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[QUERY_ERROR] ${queryName} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  // Health check for subscription system
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    metrics: {
      responseTime: number;
      activeConnections: number;
      errorRate: number;
    };
  }> {
    const startTime = Date.now();
    const checks: Record<string, boolean> = {};

    try {
      // Database connectivity
      await dbConnect();
      checks.database = true;

      // Stripe API connectivity
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.products.list({ limit: 1 });
        checks.stripe = true;
      } catch {
        checks.stripe = false;
      }

      // Recent payment processing
      try {
        const recentPayments = await SubscriptionHistory.find({
          action: { $in: ['payment_succeeded', 'payment_failed'] },
          created_at: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
        }).lean();
        
        const failureRate = recentPayments.length > 0 
          ? recentPayments.filter(p => p.action === 'payment_failed').length / recentPayments.length
          : 0;
        
        checks.paymentProcessing = failureRate < 0.1; // Less than 10% failure rate
      } catch {
        checks.paymentProcessing = false;
      }

      const responseTime = Date.now() - startTime;
      const healthyChecks = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.values(checks).length;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyChecks === totalChecks) {
        status = 'healthy';
      } else if (healthyChecks >= totalChecks * 0.7) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        checks,
        metrics: {
          responseTime,
          activeConnections: 1, // Placeholder
          errorRate: 0, // Calculate from recent errors
        },
      };

    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        checks,
        metrics: {
          responseTime: Date.now() - startTime,
          activeConnections: 0,
          errorRate: 1,
        },
      };
    }
  }
}

// Real-time alerting system
export class AlertingSystem {
  static async checkAlerts(): Promise<void> {
    try {
      const metrics = await SubscriptionAnalytics.getSubscriptionMetrics();
      
      // Check for high payment failure rate
      if (metrics.paymentFailureRate > 20) {
        await this.sendAlert('high_payment_failure_rate', {
          rate: metrics.paymentFailureRate,
          failedPayments: metrics.failedPayments,
        });
      }
      
      // Check for high churn rate
      if (metrics.churnRate > 10) {
        await this.sendAlert('high_churn_rate', {
          rate: metrics.churnRate,
          cancelations: metrics.cancelationsThisMonth,
        });
      }
      
      // Check for trials ending soon
      if (metrics.trialsEndingSoon > 10) {
        await this.sendAlert('trials_ending_soon', {
          count: metrics.trialsEndingSoon,
        });
      }
      
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  private static async sendAlert(type: string, data: any): Promise<void> {
    const alert = {
      type,
      data,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(type),
    };

    // In production, integrate with your alerting service
    console.warn('[ALERT]', alert);

    // Example integrations:
    // - Slack webhook
    // - PagerDuty
    // - Email notifications
    // - Discord webhook
  }

  private static getAlertSeverity(type: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'high_payment_failure_rate':
        return 'high';
      case 'high_churn_rate':
        return 'medium';
      case 'trials_ending_soon':
        return 'low';
      default:
        return 'medium';
    }
  }
}