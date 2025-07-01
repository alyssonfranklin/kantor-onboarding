import { NextRequest } from 'next/server'
import { POST as createCheckoutSession } from '@/app/api/create-checkout-session/route'
import { POST as handleWebhook } from '@/app/api/webhooks/stripe/route'
import { GET as getSubscriptionStatus } from '@/app/api/subscription-status/route'

// Mock dependencies
jest.mock('@/lib/mongodb/connect')
jest.mock('@/lib/mongodb/models/user.model')
jest.mock('@/lib/mongodb/models/subscription.model')
jest.mock('@/lib/mongodb/models/subscription-history.model')
jest.mock('@/lib/mongodb/models/price.model')
jest.mock('@/lib/mongodb/models/insight.model')
jest.mock('@/lib/stripe/config')
jest.mock('@/lib/middleware/auth')

// Mock Stripe
const mockStripe = {
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  subscriptions: {
    retrieve: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
}

jest.mock('stripe', () => jest.fn(() => mockStripe))

describe('Subscription Flow Integration Tests', () => {
  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    name: 'Test User',
    company_id: 'company_123',
    subscription_status: 'inactive',
    stripe_customer_id: null,
  }

  const mockPriceRecord = {
    price_id: 'price_test_pro',
    stripe_price_id: 'price_test_pro',
    kantor_version: 'pro',
    price_value: 4999,
    currency_id: 'usd',
    billing_period: 'monthly',
    is_active: true,
  }

  const mockPlanInsight = {
    kantor_version: 'pro',
    description: 'Pro plan features',
    features: ['Advanced analytics', 'Priority support'],
    insights_limit: 100,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock auth middleware to return user info
    const { withAuth } = require('@/lib/middleware/auth')
    withAuth.mockImplementation((request: NextRequest, handler: Function) => 
      handler(request, { userId: 'user_123', companyId: 'company_123' })
    )

    // Mock database models
    const User = require('@/lib/mongodb/models/user.model').default
    const Price = require('@/lib/mongodb/models/price.model').default
    const Insight = require('@/lib/mongodb/models/insight.model').default

    User.findOne.mockResolvedValue(mockUser)
    Price.findOne.mockResolvedValue(mockPriceRecord)
    Insight.findOne.mockResolvedValue(mockPlanInsight)
  })

  describe('Checkout Session Creation', () => {
    it('creates checkout session successfully', async () => {
      const mockCustomer = { id: 'cus_test_123' }
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/cs_test_123',
      }

      mockStripe.customers.create.mockResolvedValue(mockCustomer)
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_test_pro',
          planId: 'pro',
          billingPeriod: 'monthly',
        }),
      })

      const response = await createCheckoutSession(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.sessionId).toBe('cs_test_123')
      expect(data.url).toBe('https://checkout.stripe.com/cs_test_123')
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        metadata: {
          userId: 'user_123',
          companyId: 'company_123',
          internalUserId: 'user_123',
        },
      })
    })

    it('prevents duplicate subscriptions', async () => {
      const User = require('@/lib/mongodb/models/user.model').default
      User.findOne.mockResolvedValue({
        ...mockUser,
        subscription_status: 'active',
      })

      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_test_pro',
          planId: 'pro',
          billingPeriod: 'monthly',
        }),
      })

      const response = await createCheckoutSession(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.message).toContain('already has an active subscription')
    })

    it('validates pricing data', async () => {
      const Price = require('@/lib/mongodb/models/price.model').default
      Price.findOne.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'invalid_price',
          planId: 'pro',
          billingPeriod: 'monthly',
        }),
      })

      const response = await createCheckoutSession(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Invalid price or plan configuration')
    })
  })

  describe('Webhook Event Processing', () => {
    it('processes checkout session completed event', async () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
            metadata: {
              userId: 'user_123',
              companyId: 'company_123',
              planId: 'pro',
              billingPeriod: 'monthly',
            },
          },
        },
      }

      const mockSubscription = {
        id: 'sub_test_123',
        status: 'trialing',
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
        trial_end: Math.floor(Date.now() / 1000) + 604800, // 7 days
        items: {
          data: [{
            price: { unit_amount: 4999 }
          }]
        },
        currency: 'usd',
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription)

      // Mock SubscriptionHistory to simulate no existing events
      const SubscriptionHistory = require('@/lib/mongodb/models/subscription-history.model').default
      SubscriptionHistory.findOne.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: 'webhook_body',
        headers: {
          'stripe-signature': 'test_signature',
        },
      })

      const response = await handleWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
      expect(data.processed).toBe(true)
    })

    it('handles duplicate webhook events', async () => {
      const mockEvent = {
        id: 'evt_duplicate_123',
        type: 'checkout.session.completed',
        data: { object: {} },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      // Mock existing history record
      const SubscriptionHistory = require('@/lib/mongodb/models/subscription-history.model').default
      SubscriptionHistory.findOne.mockResolvedValue({ stripe_event_id: 'evt_duplicate_123' })

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: 'webhook_body',
        headers: {
          'stripe-signature': 'test_signature',
        },
      })

      const response = await handleWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })

    it('validates webhook signatures', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: 'webhook_body',
        headers: {
          'stripe-signature': 'invalid_signature',
        },
      })

      const response = await handleWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid signature')
    })
  })

  describe('Subscription Status Retrieval', () => {
    it('returns comprehensive subscription status', async () => {
      const mockSubscriptionRecord = {
        user_id: 'user_123',
        company_id: 'company_123',
        status: 'active',
        kantor_version: 'pro',
      }

      const mockStripeSubscription = {
        id: 'sub_test_123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        cancel_at_period_end: false,
        default_payment_method: {
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025,
          },
        },
      }

      const User = require('@/lib/mongodb/models/user.model').default
      const Subscription = require('@/lib/mongodb/models/subscription.model').default
      const Insight = require('@/lib/mongodb/models/insight.model').default

      User.findOne.mockResolvedValue({
        ...mockUser,
        subscription_status: 'active',
        current_plan_id: 'pro',
        subscription_id: 'sub_test_123',
      })

      Subscription.findOne.mockResolvedValue(mockSubscriptionRecord)
      Insight.findOne.mockResolvedValue(mockPlanInsight)
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockStripeSubscription)

      const request = new NextRequest('http://localhost:3000/api/subscription-status')

      const response = await getSubscriptionStatus(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.subscription.status).toBe('active')
      expect(data.data.subscription.planId).toBe('pro')
      expect(data.data.stripe.subscriptionId).toBe('sub_test_123')
    })

    it('handles missing subscription gracefully', async () => {
      const User = require('@/lib/mongodb/models/user.model').default
      User.findOne.mockResolvedValue({
        ...mockUser,
        subscription_status: 'inactive',
      })

      const request = new NextRequest('http://localhost:3000/api/subscription-status')

      const response = await getSubscriptionStatus(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.subscription.status).toBe('inactive')
      expect(data.data.stripe).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('handles Stripe API errors in checkout creation', async () => {
      mockStripe.customers.create.mockRejectedValue({
        type: 'StripeCardError',
        message: 'Your card was declined.',
        code: 'card_declined',
      })

      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_test_pro',
          planId: 'pro',
          billingPeriod: 'monthly',
        }),
      })

      const response = await createCheckoutSession(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Your card was declined.')
    })

    it('handles database connection errors', async () => {
      const { connectToDatabase } = require('@/lib/mongodb/connect')
      connectToDatabase.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/subscription-status')

      const response = await getSubscriptionStatus(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})