# 🚀 Voxerion Kantor Onboarding - Deployment Checklist

## Pre-Deployment Checklist

### 🔧 Environment Setup

#### Required Environment Variables
```bash
# Core Application
NODE_ENV=production
NEXT_PUBLIC_DOMAIN=https://yourdomain.com
PORT=3000

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/voxerion-kantor

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_TRIAL_PERIOD_DAYS=7

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# Cron Jobs
CRON_SECRET_TOKEN=your-cron-secret-token-here

# Monitoring
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ENVIRONMENT=production
```

### 🗄️ Database Migration

#### 1. Backup Current Database
```bash
# Create backup of production database
mongodump --uri="mongodb+srv://user:password@cluster.mongodb.net/voxerion-kantor" --out=backup-$(date +%Y%m%d)
```

#### 2. Update User Schema
Ensure the `users` collection has the new subscription fields:
```javascript
// Add these fields to existing user documents
{
  // Subscription fields
  stripe_customer_id: String,
  subscription_id: String,
  current_plan_id: String, // FK to insights.kantor_version
  subscription_status: String, // 'active' | 'canceled' | 'past_due' | 'trial' | 'incomplete' | 'paused'
  trial_end_date: Date,
  billing_period: String, // 'monthly' | 'annual'
  subscription_start_date: Date,
  subscription_end_date: Date,
  payment_method_updated_at: Date,
}
```

#### 3. Create New Collections
```javascript
// Subscription collection
db.subscriptions.createIndex({ "user_id": 1 })
db.subscriptions.createIndex({ "company_id": 1 })
db.subscriptions.createIndex({ "stripe_subscription_id": 1 }, { unique: true })

// Subscription History collection
db.subscription_histories.createIndex({ "user_id": 1 })
db.subscription_histories.createIndex({ "company_id": 1 })
db.subscription_histories.createIndex({ "stripe_event_id": 1 }, { unique: true })
db.subscription_histories.createIndex({ "created_at": -1 })

// Payment collection
db.payments.createIndex({ "user_id": 1 })
db.payments.createIndex({ "subscription_id": 1 })
db.payments.createIndex({ "stripe_invoice_id": 1 }, { unique: true })
```

### 🎯 Stripe Configuration

#### 1. Create Products and Prices
```bash
# Basic Plan
stripe products create --name="Basic Plan" --description="Perfect for small teams"
stripe prices create --product=prod_basic --unit-amount=2999 --currency=usd --recurring=interval:month
stripe prices create --product=prod_basic --unit-amount=28788 --currency=usd --recurring=interval:year

# Pro Plan  
stripe products create --name="Pro Plan" --description="Ideal for growing businesses"
stripe prices create --product=prod_pro --unit-amount=4999 --currency=usd --recurring=interval:month
stripe prices create --product=prod_pro --unit-amount=47988 --currency=usd --recurring=interval:year

# Enterprise Plan
stripe products create --name="Enterprise Plan" --description="For large organizations"
stripe prices create --product=prod_enterprise --unit-amount=9999 --currency=usd --recurring=interval:month
stripe prices create --product=prod_enterprise --unit-amount=95988 --currency=usd --recurring=interval:year
```

#### 2. Configure Webhook Endpoint
```bash
# Create webhook endpoint
stripe listen --forward-to https://yourdomain.com/api/webhooks/stripe

# Or via Dashboard:
# URL: https://yourdomain.com/api/webhooks/stripe
# Events to send:
# - checkout.session.completed
# - customer.subscription.created
# - customer.subscription.updated
# - customer.subscription.deleted
# - customer.subscription.trial_will_end
# - invoice.payment_succeeded
# - invoice.payment_failed
# - invoice.upcoming
# - invoice.payment_action_required
# - customer.updated
# - payment_method.attached
# - customer.subscription.paused
# - customer.subscription.resumed
```

#### 3. Update Price Records in Database
```javascript
// Update the price collection with Stripe price IDs
db.prices.updateMany(
  { kantor_version: "basic", billing_period: "monthly" },
  { $set: { stripe_price_id: "price_basic_monthly_id" } }
)
db.prices.updateMany(
  { kantor_version: "basic", billing_period: "annual" },
  { $set: { stripe_price_id: "price_basic_annual_id" } }
)
// Repeat for pro and enterprise plans
```

### 🔒 Security Configuration

#### 1. Security Headers
Add to `next.config.js`:
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

#### 2. CORS Configuration
```javascript
// Add to API routes that need CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

### 🧪 Testing Checklist

#### 1. Run Test Suite
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

#### 2. Manual Testing Scenarios
- [ ] **Subscription Creation Flow**
  - [ ] Select plan and create checkout session
  - [ ] Complete payment with test card
  - [ ] Verify user status updates
  - [ ] Verify welcome email sent

- [ ] **Trial Flow**
  - [ ] Start trial subscription
  - [ ] Verify trial status
  - [ ] Test trial reminder emails
  - [ ] Test trial conversion

- [ ] **Payment Processing**
  - [ ] Successful payment webhook
  - [ ] Failed payment webhook  
  - [ ] Payment retry logic
  - [ ] Invoice generation

- [ ] **Subscription Management**
  - [ ] Cancel subscription
  - [ ] Pause/resume subscription
  - [ ] Plan upgrades/downgrades
  - [ ] Billing period changes

- [ ] **Error Handling**
  - [ ] Invalid payment methods
  - [ ] Network timeouts
  - [ ] Database connection issues
  - [ ] Stripe API errors

#### 3. Load Testing
```bash
# Use tools like Artillery, k6, or JMeter
# Test key endpoints:
# - /api/create-checkout-session
# - /api/webhooks/stripe
# - /api/subscription-status
```

### 📊 Monitoring Setup

#### 1. Application Monitoring
```bash
# Sentry for error tracking
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ENVIRONMENT=production

# Performance monitoring
ENABLE_PERFORMANCE_MONITORING=true

# Health check endpoint
curl https://yourdomain.com/api/health
```

#### 2. Database Monitoring
- [ ] Set up MongoDB Atlas monitoring
- [ ] Configure query performance alerts
- [ ] Set up connection pool monitoring
- [ ] Enable slow query logging

#### 3. Stripe Monitoring
- [ ] Enable Stripe Dashboard notifications
- [ ] Set up payment failure alerts
- [ ] Monitor churn rate
- [ ] Track subscription metrics

### 🔄 Automation Setup

#### 1. Cron Jobs
```bash
# Set up automated trial reminders
# Option 1: Vercel Cron (if using Vercel)
# Add to vercel.json:
{
  "crons": [{
    "path": "/api/cron/trial-reminders",
    "schedule": "0 9 * * *"
  }]
}

# Option 2: External cron service
# Configure to call: POST https://yourdomain.com/api/cron/trial-reminders
# With header: Authorization: Bearer your-cron-secret-token
```

#### 2. Backup Automation
```bash
# Daily database backups
mongodump --uri="$MONGODB_URI" --out="backup-$(date +%Y%m%d)" --gzip
```

### 📈 Performance Optimization

#### 1. Database Optimization
```javascript
// Ensure proper indexing
db.users.createIndex({ "subscription_status": 1 })
db.users.createIndex({ "trial_end_date": 1 })
db.subscription_histories.createIndex({ "action": 1, "created_at": -1 })

// Enable MongoDB connection pooling
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/voxerion-kantor?maxPoolSize=20&w=majority
```

#### 2. API Optimization
- [ ] Enable gzip compression
- [ ] Implement API response caching
- [ ] Optimize database queries
- [ ] Use connection pooling

#### 3. Frontend Optimization
- [ ] Enable Next.js static generation where possible
- [ ] Optimize bundle size
- [ ] Implement proper loading states
- [ ] Add error boundaries

## Deployment Steps

### 🚀 Production Deployment

#### 1. Pre-deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Environment variables configured
- [ ] Database migration ready
- [ ] Stripe configuration complete

#### 2. Deploy Application
```bash
# Build application
npm run build

# Deploy to your platform (Vercel, Railway, AWS, etc.)
# Example for Vercel:
vercel --prod

# Example for Railway:
railway up

# Example for Docker:
docker build -t voxerion-kantor .
docker run -p 3000:3000 voxerion-kantor
```

#### 3. Post-deployment Verification
- [ ] Health check endpoint responding
- [ ] Database connections working
- [ ] Stripe webhook endpoint accessible
- [ ] Email notifications working
- [ ] Error monitoring active

### 🔍 Post-Deployment Monitoring

#### 1. First 24 Hours
- [ ] Monitor error rates
- [ ] Check payment processing
- [ ] Verify webhook delivery
- [ ] Monitor database performance
- [ ] Check email delivery rates

#### 2. First Week
- [ ] Analyze subscription metrics
- [ ] Review trial conversion rates
- [ ] Monitor churn rates
- [ ] Check payment failure rates
- [ ] Review performance metrics

#### 3. Ongoing Monitoring
- [ ] Weekly subscription reports
- [ ] Monthly revenue analysis
- [ ] Quarterly performance review
- [ ] Regular security audits

## Rollback Plan

### 🔄 Emergency Rollback

#### 1. Application Rollback
```bash
# Vercel
vercel rollback

# Railway
railway rollback

# Docker
docker run -p 3000:3000 voxerion-kantor:previous-tag
```

#### 2. Database Rollback
```bash
# Restore from backup
mongorestore --uri="$MONGODB_URI" --drop backup-YYYYMMDD/
```

#### 3. Stripe Configuration
- [ ] Disable new webhook endpoint
- [ ] Revert to previous webhook endpoint
- [ ] Update environment variables

## Support Documentation

### 📞 Emergency Contacts
- **DevOps Lead**: [contact info]
- **Database Admin**: [contact info]
- **Stripe Support**: [support info]
- **Hosting Provider**: [support info]

### 🔗 Important Links
- **Stripe Dashboard**: https://dashboard.stripe.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Application Monitoring**: [monitoring dashboard]
- **Error Tracking**: [error tracking dashboard]

---

## ✅ Final Checklist

- [ ] All environment variables configured
- [ ] Database migration completed
- [ ] Stripe products and webhooks configured
- [ ] Security headers implemented
- [ ] Monitoring and alerting active
- [ ] Cron jobs configured
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Team notified of deployment
- [ ] Rollback plan ready

**Deployment approved by**: ________________  
**Date**: ________________  
**Deployment lead**: ________________