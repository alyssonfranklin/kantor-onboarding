import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import { getEnvironment } from '@/lib/environment';
import Company from '@/lib/mongodb/models/company.model';

/**
 * GET /api/health
 * Health check endpoint for MongoDB and API connectivity
 * This endpoint is exempted from the versioning middleware
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🏥 Health check called:', req.url);
    
    // Check MongoDB connection
    const start = Date.now();
    await dbConnect();
    const elapsed = Date.now() - start;
    
    // Extract request details for debugging
    const origin = req.headers.get('origin') || 'unknown';
    const referer = req.headers.get('referer') || 'unknown';
    const host = req.headers.get('host') || 'unknown';
    
    // Extract path from URL
    const url = new URL(req.url);
    const path = url.pathname;
    const companyId = url.searchParams.get('companyId');
    
    // Test vector store functionality if companyId provided
    let vectorStoreTest = null;
    if (companyId) {
      console.log('🧪 Testing vector store for company:', companyId);
      try {
        const company = await Company.findOne({ company_id: companyId });
        console.log('🏢 Company found:', !!company, company?.assistant_id);
        vectorStoreTest = {
          companyFound: !!company,
          assistantId: company?.assistant_id || null,
          companyId
        };
      } catch (error) {
        console.error('🚨 Vector store test error:', error);
        vectorStoreTest = {
          error: (error as Error).message,
          companyId
        };
      }
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'API and database connection healthy',
      timestamp: new Date().toISOString(),
      latency: `${elapsed}ms`,
      environment: getEnvironment(),
      request: {
        path,
        method: req.method,
        origin,
        referer,
        host
      },
      services: {
        api: 'healthy',
        database: 'healthy'
      },
      vectorStoreTest
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      services: {
        api: 'healthy',
        database: 'degraded'
      }
    }, { status: 500 });
  }
}