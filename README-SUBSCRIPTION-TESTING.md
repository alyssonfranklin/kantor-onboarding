# 🧪 Subscription System Testing Guide

## Overview

This document outlines the comprehensive testing strategy for the Voxerion Kantor Onboarding subscription system, following best practices from the reference repository and adapted for subscription billing.

## 🏗️ Testing Architecture

### Test Types

1. **Unit Tests** - Individual component and function testing
2. **Integration Tests** - API endpoint and database integration testing  
3. **End-to-End Tests** - Complete subscription flow testing
4. **Load Tests** - Performance and scalability testing
5. **Security Tests** - Authentication and payment security testing

### Testing Stack

- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **Supertest** - HTTP assertion library for API testing
- **Custom Test Runner** - Subscription flow validation

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run subscription flow tests
npm run test:subscription-flow

# Run all tests
npm run test:all
```

### Test Coverage
```bash
npm run test:coverage
```

## 📋 Test Categories

### 1. Unit Tests

#### Component Tests
```bash
# Test payment components
npm test -- --testPathPattern=components/payment

# Test hooks
npm test -- --testPathPattern=hooks
```

**Key Test Files:**
- `src/components/payment/__tests__/PlanSelection.test.tsx`
- `src/hooks/__tests__/usePayment.test.ts`

#### What's Tested:
- ✅ Plan selection UI rendering
- ✅ Billing period toggle functionality
- ✅ Payment state management
- ✅ Error handling in components
- ✅ Loading states and user interactions

### 2. Integration Tests

#### API Endpoint Tests
```bash
npm run test:integration
```

**Test File:**
- `tests/integration/subscription-flow.test.ts`

#### What's Tested:
- ✅ Checkout session creation
- ✅ Webhook event processing
- ✅ Subscription status retrieval
- ✅ Database integration
- ✅ Stripe API integration
- ✅ Error handling and validation

### 3. End-to-End Flow Tests

#### Subscription Flow Validation
```bash
npm run test:subscription-flow
```

**Test Script:**
- `scripts/test-subscription-flow.js`

#### What's Tested:
- ✅ Health check endpoint
- ✅ Plan selection API
- ✅ Checkout session creation
- ✅ Subscription status API
- ✅ Trial status API
- ✅ Webhook endpoint validation
- ✅ Error handling patterns
- ✅ Database connectivity

## 🔧 Test Configuration

### Environment Setup

Create `.env.test` file:
```bash
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/voxerion-test
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_mock_key
STRIPE_SECRET_KEY=sk_test_mock_key
STRIPE_WEBHOOK_SECRET=whsec_test_mock_secret
JWT_SECRET=test-jwt-secret
```

### Jest Configuration

**File:** `jest.config.js`
- ✅ Next.js integration
- ✅ TypeScript support
- ✅ React Testing Library setup
- ✅ Mock configurations
- ✅ Coverage reporting

### Mock Strategy

#### Stripe Mocking
```javascript
// Stripe API calls are mocked in tests
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: { create: jest.fn(), retrieve: jest.fn() },
    subscriptions: { create: jest.fn(), retrieve: jest.fn() },
    checkout: { sessions: { create: jest.fn() } },
  }))
})
```

#### Database Mocking
```javascript
// MongoDB connection is mocked
jest.mock('@/lib/mongodb/connect', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({}),
}))
```

## 📊 Test Scenarios

### Subscription Creation Flow

#### Scenario 1: Successful Subscription
```javascript
// Test steps:
1. Select a plan (Pro Monthly)
2. Create checkout session
3. Simulate successful payment
4. Verify user status update
5. Check email notification
```

#### Scenario 2: Failed Payment
```javascript
// Test steps:
1. Select a plan
2. Create checkout session
3. Simulate payment failure
4. Verify error handling
5. Check retry logic
```

### Trial Management

#### Scenario 3: Trial Conversion
```javascript
// Test steps:
1. Start trial subscription
2. Verify trial status
3. Simulate trial end
4. Check conversion to paid
5. Verify billing cycle start
```

#### Scenario 4: Trial Cancellation
```javascript
// Test steps:
1. Start trial subscription
2. Cancel during trial
3. Verify immediate cancellation
4. Check no billing occurs
```

### Error Handling

#### Scenario 5: Network Errors
```javascript
// Test steps:
1. Simulate network timeout
2. Verify retry logic
3. Check user-friendly errors
4. Test graceful degradation
```

#### Scenario 6: Invalid Payment Methods
```javascript
// Test steps:
1. Use expired card
2. Use insufficient funds card
3. Use invalid CVC
4. Verify error messages
```

## 🎯 Manual Testing Checklist

### Pre-Deployment Testing

#### Payment Flow Testing
- [ ] **Plan Selection**
  - [ ] Plans load correctly
  - [ ] Pricing displays accurately
  - [ ] Billing period toggle works
  - [ ] Features list is complete

- [ ] **Checkout Process**
  - [ ] Checkout session creates successfully
  - [ ] Stripe Checkout loads
  - [ ] Test card payments work
  - [ ] Trial period applies correctly

- [ ] **Subscription Management**
  - [ ] Subscription status displays correctly
  - [ ] Trial countdown works
  - [ ] Plan details are accurate
  - [ ] Usage limits are enforced

#### Email Testing
- [ ] **Welcome Emails**
  - [ ] Send on successful subscription
  - [ ] Include correct plan details
  - [ ] Trial information is accurate
  - [ ] Links work correctly

- [ ] **Trial Reminders**
  - [ ] Send at correct intervals (7, 3, 1 days)
  - [ ] Include urgency messaging
  - [ ] Conversion CTAs work

- [ ] **Payment Notifications**
  - [ ] Success confirmations
  - [ ] Failure notifications
  - [ ] Cancellation confirmations

#### Webhook Testing
- [ ] **Event Processing**
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`

- [ ] **Database Sync**
  - [ ] User status updates
  - [ ] Subscription records
  - [ ] Payment history
  - [ ] Audit trails

## 🔒 Security Testing

### Authentication Testing
```bash
# Test protected endpoints
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:3000/api/subscription-status

# Should return 401 Unauthorized
```

### Payment Security
```bash
# Test webhook signature validation
curl -X POST \
  -H "Content-Type: application/json" \
  -H "stripe-signature: invalid_signature" \
  -d '{"test": "data"}' \
  http://localhost:3000/api/webhooks/stripe

# Should return 400 Bad Request
```

### Data Validation
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection

## 📈 Performance Testing

### Load Testing with Artillery

#### Install Artillery
```bash
npm install -g artillery
```

#### Test Configuration
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Subscription Flow"
    flow:
      - get:
          url: "/api/plans"
      - post:
          url: "/api/create-checkout-session"
          json:
            priceId: "price_test_pro"
            planId: "pro"
            billingPeriod: "monthly"
```

#### Run Load Tests
```bash
artillery run artillery-config.yml
```

### Performance Benchmarks

#### Target Response Times
- **Plan Selection**: < 200ms
- **Checkout Creation**: < 500ms
- **Subscription Status**: < 300ms
- **Webhook Processing**: < 1000ms

#### Database Query Optimization
```javascript
// Monitor slow queries
db.setProfilingLevel(2, { slowms: 100 })

// Check query performance
db.system.profile.find().sort({ ts: -1 }).limit(5)
```

## 🐛 Debugging Tests

### Debug Mode
```bash
# Run tests in debug mode
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="PlanSelection"
```

### Test Logs
```bash
# Enable detailed logging
DEBUG=* npm test

# View test coverage report
open coverage/lcov-report/index.html
```

### Common Issues

#### Mock Not Working
```javascript
// Ensure mocks are cleared between tests
beforeEach(() => {
  jest.clearAllMocks()
})
```

#### Async Test Failures
```javascript
// Use proper async/await syntax
test('async operation', async () => {
  const result = await asyncFunction()
  expect(result).toBe(expected)
})
```

## 📋 CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:all
      - run: npm run lint
```

### Pre-commit Hooks
```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run test && npm run lint"
```

## 🎉 Test Results Interpretation

### Success Criteria
- ✅ **Unit Tests**: > 80% coverage
- ✅ **Integration Tests**: All API endpoints working
- ✅ **E2E Tests**: Complete flows functional
- ✅ **Performance**: All endpoints under target response times
- ✅ **Security**: No vulnerabilities detected

### Failure Analysis
1. **Check logs** for specific error messages
2. **Verify environment** configuration
3. **Confirm database** connectivity
4. **Test Stripe integration** separately
5. **Review recent changes** for breaking modifications

---

## 📞 Support

For testing issues or questions:
- Check the main [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)
- Review test logs and error messages
- Verify environment configuration
- Contact development team

**Remember**: Always run the full test suite before deploying to production!