# 🎉 Stripe Subscription Integration - Complete Setup Guide

This document provides complete instructions for setting up the Stripe subscription billing system integrated into your Voxerion application.

## 📋 Overview

The Stripe integration has been implemented to work seamlessly with your existing Stripe products and pricing. The system includes:

- **Subscription billing** after user creation
- **Payment flow** in `/payment` route  
- **7-day free trial** for all plans
- **Monthly/Annual** billing options
- **Webhook handling** for subscription events
- **Integration** with existing database structure

---

## ✅ What's Been Implemented

### **Database Models**
- **Price Model** (`src/lib/mongodb/models/price.model.ts`) - Syncs with your Stripe prices
- **Subscription Model** (`src/lib/mongodb/models/subscription.model.ts`) - Tracks customer subscriptions  
- **Payment Model** (`src/lib/mongodb/models/payment.model.ts`) - Records billing history

### **API Endpoints**
- `GET /api/v1/pricing` - Displays your Stripe products/prices
- `POST /api/v1/stripe/create-checkout-session` - Creates Stripe Checkout
- `POST /api/v1/stripe/webhook` - Handles Stripe events
- `GET /api/v1/stripe/sync-products` - Syncs your Stripe products
- `GET /api/v1/stripe/verify-session` - Verifies successful payments

### **Frontend Pages**
- `/payment` - Plan selection with monthly/annual toggle
- `/payment/success` - Success confirmation with trial info

### **Key Features**
- ✅ **7-day free trial** for all plans
- ✅ **Monthly/Annual billing** options with discounts
- ✅ **Responsive design** matching your brand colors
- ✅ **Orange/red button colors** as requested
- ✅ **Company-scoped subscriptions** 
- ✅ **Webhook handling** for subscription events
- ✅ **Trial period logic** and management
- ✅ **Payment method support** (Card, PayPal, Pix)
- ✅ **Form validation** and error handling

---

## 🔧 Setup Instructions

### **Step 1: Configure Environment Variables**

Add the following variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key  
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_stripe
NEXT_PUBLIC_DOMAIN=http://localhost:3000

# For production, use:
# STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
# NEXT_PUBLIC_DOMAIN=https://yourdomain.com
```

**Where to find these values:**
- **Secret & Publishable Keys**: Stripe Dashboard → Developers → API Keys
- **Webhook Secret**: Created in Step 3 below
- **Domain**: Your application's URL

### **Step 2: Sync Your Stripe Products**

Call this API endpoint once to import your existing Stripe products into the local database:

```bash
# Using curl:
curl -X GET http://localhost:3000/api/v1/stripe/sync-products

# Or visit in browser:
http://localhost:3000/api/v1/stripe/sync-products
```

**What this does:**
- Fetches all active products and prices from your Stripe account
- Creates corresponding records in your local `Price` model
- Syncs product features and descriptions
- Maps billing periods (monthly/annual)

### **Step 3: Configure Stripe Webhook**

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint**: `https://yourdomain.com/api/v1/stripe/webhook`
3. **Select events to listen for:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. **Copy the webhook secret** and add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### **Step 4: Test the Integration**

1. **Start your application:**
   ```bash
   npm run dev
   ```

2. **Visit the payment page:**
   ```
   http://localhost:3000/payment
   ```

3. **Test with Stripe test cards:**
   - **Success**: `4242 4242 4242 4242`
   - **Declined**: `4000 0000 0000 0002`
   - Use any future expiration date and any 3-digit CVC

4. **Verify webhook events:**
   - Check Stripe Dashboard → Developers → Webhooks → [Your endpoint]
   - Ensure events are being received successfully

---

## 🎨 Customization Options

### **Product Metadata in Stripe**

To enhance the pricing display, you can add metadata to your Stripe products:

```json
{
  "kantor_version": "Business",
  "features": "Unlimited users,Real-time analytics,Priority support",
  "popular": "true"
}
```

### **Feature Lists**

The system automatically assigns features based on plan names, but you can customize them by:

1. **Adding features to Stripe product metadata** (recommended)
2. **Modifying the `getDefaultFeatures()` function** in `/api/v1/stripe/sync-products`
3. **Updating the Insight model** directly in your database

### **Pricing Display**

The payment page automatically:
- Shows **monthly/annual toggle**
- Calculates **annual savings** (typically 2 months free)
- Highlights **popular plans** (Business/Pro plans)
- Displays **trial information**

---

## 📊 Database Structure

### **Subscription Tracking**

Each subscription record includes:
- Company and user association
- Stripe subscription and customer IDs
- Current period dates
- Trial period tracking
- Billing period and amount
- Status management

### **Payment History**

All payments are recorded with:
- Payment method used
- Amount and currency
- Success/failure status
- Associated subscription
- Stripe payment intent ID

---

## 🔄 Webhook Event Handling

The webhook handler processes these events:

- **`checkout.session.completed`** → Activates subscription after successful checkout
- **`customer.subscription.created`** → Creates subscription record
- **`customer.subscription.updated`** → Updates subscription status/billing
- **`customer.subscription.deleted`** → Marks subscription as canceled
- **`invoice.payment_succeeded`** → Records successful payment
- **`invoice.payment_failed`** → Records failed payment, updates status

---

## 🚀 Production Deployment

### **Environment Variables for Production**

```bash
# Production Stripe keys
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
NEXT_PUBLIC_DOMAIN=https://yourdomain.com

# Webhook endpoint
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
```

### **SSL Certificate Required**

- Stripe webhooks require HTTPS endpoints
- Ensure your production domain has a valid SSL certificate

### **Webhook Endpoint Security**

The webhook handler includes:
- **Signature verification** using Stripe's webhook secret
- **Event deduplication** protection
- **Error handling** and logging

---

## 🔍 Troubleshooting

### **Common Issues**

1. **"No pricing data available" error**
   - **Solution**: Run `/api/v1/stripe/sync-products` endpoint
   - **Cause**: Local database not synced with Stripe

2. **Webhook events not received**
   - **Check**: Webhook URL is accessible via HTTPS
   - **Verify**: Webhook secret matches environment variable
   - **Test**: Use Stripe CLI for local testing

3. **Payment page shows loading indefinitely**
   - **Check**: Stripe publishable key is correctly set
   - **Verify**: API endpoints are accessible
   - **Debug**: Check browser console for errors

### **Testing Webhooks Locally**

Use Stripe CLI to forward webhooks to your local development:

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook

# Test specific events
stripe trigger checkout.session.completed
```

---

## 📞 Support

For additional support:

1. **Stripe Documentation**: [https://stripe.com/docs](https://stripe.com/docs)
2. **Webhook Testing**: Use Stripe Dashboard → Developers → Webhooks → Test
3. **API Testing**: Use tools like Postman or curl to test endpoints

---

## 🎯 Key Advantages

- **✅ Uses Your Existing Stripe Products** - No need to recreate anything
- **✅ Automatic Sync** - Pulls your real pricing and features  
- **✅ Trial-First** - 7-day free trial for all plans
- **✅ Brand Consistent** - Matches your orange/red color scheme
- **✅ Fully Integrated** - Works with your existing user/company system
- **✅ Production Ready** - Includes error handling, validation, and security
- **✅ Webhook Driven** - Real-time subscription status updates

The implementation is ready to use with your existing Stripe products! Just add your API keys and run the sync endpoint to get started.