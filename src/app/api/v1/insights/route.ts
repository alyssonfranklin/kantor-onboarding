// src/app/api/v1/insights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Insight from '@/lib/mongodb/models/insight.model';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Fetch all insights data sorted by insights_limit (ascending)
    const insights = await Insight.find({})
      .select('insight_id kantor_version insights_limit price_monthly description')
      .sort({ insights_limit: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: insights,
      count: insights.length
    });

  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch insights data' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const data = await request.json();
    const { insight_id, kantor_version, insights_limit, price_monthly, description, features } = data;

    // Validate required fields
    if (!insight_id || !kantor_version || insights_limit === undefined) {
      return NextResponse.json(
        { 
          success: false,
          error: 'insight_id, kantor_version, and insights_limit are required' 
        },
        { status: 400 }
      );
    }

    // Check if insight_id already exists
    const existingInsight = await Insight.findOne({ insight_id });
    if (existingInsight) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Insight with this ID already exists' 
        },
        { status: 409 }
      );
    }

    // Create new insight
    const insight = await Insight.create({
      insight_id,
      kantor_version,
      insights_limit,
      price_monthly: price_monthly || 0,
      description: description || '',
      features: features || []
    });

    return NextResponse.json({
      success: true,
      message: 'Insight created successfully',
      data: insight
    });

  } catch (error) {
    console.error('Error creating insight:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create insight' 
      },
      { status: 500 }
    );
  }
}