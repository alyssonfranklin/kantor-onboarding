import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Label from '@/lib/mongodb/models/label.model';

/**
 * GET /api/v1/labels
 * Fetches labels from MongoDB based on the requested locale
 * Supports en, pt, es locales with fallback
 */
export async function GET(request: NextRequest) {
  try {
    // Get locale from query string, default to 'en'
    const searchParams = request.nextUrl.searchParams;
    let locale = searchParams.get('locale') || 'en';
    
    // Ensure locale is valid, only allow 'en', 'pt', 'es'
    locale = ['en', 'pt', 'es'].includes(locale) ? locale : 'en';
    
    // Connect to MongoDB
    await dbConnect();
    
    // Fetch all labels from the database
    const labels = await Label.find({});
    
    // If no labels found, return a 404
    if (!labels || labels.length === 0) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'No labels found in the database'
      }, { status: 404 });
    }
    
    // Transform to key-value pairs based on requested locale
    const localeField = locale as 'en' | 'pt' | 'es';
    const labelMap = labels.reduce((result: Record<string, string>, label) => {
      // Use requested locale or fallback to 'en'
      result[label.key] = label[localeField] || label.en || label.key;
      return result;
    }, {});
    
    // Return success response with labels
    return NextResponse.json({
      status: 'success',
      locale: locale,
      data: labelMap
    });
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to fetch labels',
      error: (error as Error).message
    }, { status: 500 });
  }
}