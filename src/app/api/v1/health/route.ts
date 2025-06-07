import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import { getEnvironment } from '@/lib/environment';

/**
 * GET /api/v1/health
 * Health check endpoint for MongoDB and API connectivity
 * This endpoint is exempted from the versioning middleware
 */
export async function GET(req: NextRequest) {
  try {
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
      }
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