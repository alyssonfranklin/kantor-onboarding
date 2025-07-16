import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://localhost:27017/voxerion-test'
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_secret'
process.env.NEXT_PUBLIC_DOMAIN = 'http://localhost:3000'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.CRON_SECRET_TOKEN = 'test-cron-token'

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
    prices: {
      list: jest.fn(),
      retrieve: jest.fn(),
    },
    products: {
      list: jest.fn(),
      retrieve: jest.fn(),
    },
  }))
})

// Mock MongoDB connection
jest.mock('@/lib/mongodb/connect', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({}),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}