import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { dbConnect } from '@/lib/mongodb/connect';
import Price from '@/lib/mongodb/models/price.model';
import Insight from '@/lib/mongodb/models/insight.model';

// GET /api/v1/stripe/sync-products - Sync Stripe products with local database
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Fetch all products from Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });

    // Fetch all prices from Stripe
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    });

    const syncedProducts = [];

    for (const product of products.data) {
      // Find all prices for this product
      const productPrices = prices.data.filter(price => price.product === product.id);

      for (const stripePrice of productPrices) {
        // Determine billing period
        const billingPeriod = stripePrice.recurring?.interval === 'year' ? 'annual' : 'monthly';
        
        // Extract plan name from product name or metadata
        const kantorVersion = product.metadata?.kantor_version || product.name;

        // Check if this price already exists in our database
        const existingPrice = await Price.findOne({
          stripe_price_id: stripePrice.id
        });

        if (!existingPrice) {
          // Create new price record
          const newPrice = new Price({
            price_id: `${kantorVersion.toLowerCase().replace(/\s+/g, '_')}_${billingPeriod}_${Date.now()}`,
            kantor_version: kantorVersion,
            price_value: stripePrice.unit_amount || 0,
            currency_id: stripePrice.currency.toUpperCase(),
            billing_period: billingPeriod,
            stripe_price_id: stripePrice.id,
            is_active: true
          });

          await newPrice.save();

          syncedProducts.push({
            product_id: product.id,
            product_name: product.name,
            price_id: stripePrice.id,
            kantor_version: kantorVersion,
            billing_period: billingPeriod,
            amount: stripePrice.unit_amount,
            currency: stripePrice.currency,
            status: 'created'
          });
        } else {
          // Update existing price if needed
          await Price.findOneAndUpdate(
            { stripe_price_id: stripePrice.id },
            {
              price_value: stripePrice.unit_amount || 0,
              currency_id: stripePrice.currency.toUpperCase(),
              is_active: true,
              updated_at: new Date()
            }
          );

          syncedProducts.push({
            product_id: product.id,
            product_name: product.name,
            price_id: stripePrice.id,
            kantor_version: kantorVersion,
            billing_period: billingPeriod,
            amount: stripePrice.unit_amount,
            currency: stripePrice.currency,
            status: 'updated'
          });
        }

        // Update or create insight data with features
        const features = product.metadata?.features ? 
          product.metadata.features.split(',').map(f => f.trim()) : 
          getDefaultFeatures(kantorVersion);

        await Insight.findOneAndUpdate(
          { kantor_version: kantorVersion },
          {
            kantor_version: kantorVersion,
            price_monthly: billingPeriod === 'monthly' ? stripePrice.unit_amount || 0 : undefined,
            description: product.description || `${kantorVersion} plan`,
            features: features,
            insights_limit: getInsightsLimit(kantorVersion),
            insights_day: 1
          },
          { upsert: true, new: true }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedProducts.length} products/prices from Stripe`,
      data: syncedProducts
    });

  } catch (error) {
    console.error('Error syncing Stripe products:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to sync Stripe products' },
      { status: 500 }
    );
  }
}

// Helper function to get default features based on plan name
function getDefaultFeatures(kantorVersion: string): string[] {
  const planName = kantorVersion.toLowerCase();
  
  if (planName.includes('free') || planName.includes('starter')) {
    return [
      'Up to 5 team members',
      'Basic analytics',
      'Monthly insights report',
      'Email support'
    ];
  } else if (planName.includes('basic') || planName.includes('standard')) {
    return [
      'Up to 25 team members',
      'Advanced analytics',
      'Weekly insights reports',
      'Custom tags and categories',
      'Priority email support'
    ];
  } else if (planName.includes('business') || planName.includes('pro') || planName.includes('premium')) {
    return [
      'Unlimited team members',
      'Real-time analytics',
      'Daily insights reports',
      'Advanced team management',
      'Custom integrations',
      'Priority phone & email support',
      'Dedicated account manager'
    ];
  }
  
  // Default features
  return [
    'Full platform access',
    'Analytics and insights',
    'Team management',
    'Email support'
  ];
}

// Helper function to get insights limit based on plan
function getInsightsLimit(kantorVersion: string): number {
  const planName = kantorVersion.toLowerCase();
  
  if (planName.includes('free') || planName.includes('starter')) {
    return 5;
  } else if (planName.includes('basic') || planName.includes('standard')) {
    return 25;
  } else {
    return 999; // Unlimited
  }
}