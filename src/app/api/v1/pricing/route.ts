import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import Price from '@/lib/mongodb/models/price.model';
import Insight from '@/lib/mongodb/models/insight.model';

// GET /api/v1/pricing - Get pricing tiers (synced from Stripe)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const billingPeriod = searchParams.get('billing_period') || 'monthly';

    // Get pricing from Price model (synced from Stripe)
    let pricingData = await Price.find({ 
      billing_period: billingPeriod,
      is_active: true 
    }).sort({ price_value: 1 }).lean();

    // If no pricing data, try to sync from Stripe automatically
    if (pricingData.length === 0) {
      console.log('No pricing data found, attempting to sync from Stripe...');
      
      // Fallback to Insight model for backwards compatibility
      const insights = await Insight.find({}).sort({ price_monthly: 1 }).lean();
      
      if (insights.length > 0) {
        pricingData = insights.map(insight => ({
          price_id: insight._id.toString(),
          kantor_version: insight.kantor_version,
          price_value: billingPeriod === 'annual' ? insight.price_monthly * 10 : insight.price_monthly,
          currency_id: 'USD',
          billing_period: billingPeriod,
          stripe_price_id: `price_${insight.kantor_version.toLowerCase()}_${billingPeriod}`,
          features: insight.features || [],
          description: insight.description || '',
          popular: insight.kantor_version === 'Business'
        }));
      } else {
        return NextResponse.json({
          success: false,
          message: 'No pricing data available. Please run /api/v1/stripe/sync-products first.',
          data: []
        });
      }
    } else {
      // Enhance pricing data with features from Insight model
      const insightFeatures = await Insight.find({}).lean();
      const featuresMap = insightFeatures.reduce((acc: any, insight) => {
        acc[insight.kantor_version] = {
          features: insight.features || [],
          description: insight.description || ''
        };
        return acc;
      }, {});

      pricingData = pricingData.map(price => ({
        ...price,
        features: featuresMap[price.kantor_version]?.features || [
          'Full platform access',
          'Analytics and insights',
          'Team management',
          'Email support'
        ],
        description: featuresMap[price.kantor_version]?.description || `${price.kantor_version} plan`,
        popular: price.kantor_version.toLowerCase().includes('business') || 
                 price.kantor_version.toLowerCase().includes('pro')
      }));
    }

    return NextResponse.json({
      success: true,
      data: pricingData
    });

  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/pricing - Create or update pricing
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { kantor_version, price_value, currency_id, billing_period, stripe_price_id } = body;

    // Validate required fields
    if (!kantor_version || !price_value || !billing_period) {
      return NextResponse.json(
        { success: false, message: 'kantor_version, price_value, and billing_period are required' },
        { status: 400 }
      );
    }

    // Check if pricing already exists
    const existingPrice = await Price.findOne({
      kantor_version,
      billing_period
    });

    let priceData;

    if (existingPrice) {
      // Update existing pricing
      priceData = await Price.findOneAndUpdate(
        { kantor_version, billing_period },
        {
          price_value,
          currency_id: currency_id || 'USD',
          stripe_price_id,
          updated_at: new Date()
        },
        { new: true, lean: true }
      );
    } else {
      // Create new pricing
      const newPrice = new Price({
        price_id: `${kantor_version.toLowerCase()}_${billing_period}_${Date.now()}`,
        kantor_version,
        price_value,
        currency_id: currency_id || 'USD',
        billing_period,
        stripe_price_id
      });

      priceData = await newPrice.save();
    }

    return NextResponse.json({
      success: true,
      data: priceData
    }, { status: existingPrice ? 200 : 201 });

  } catch (error) {
    console.error('Error creating/updating pricing:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}