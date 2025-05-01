import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';

/**
 * GET /api/health
 * Health check endpoint for MongoDB and API connectivity
 */
export async function GET() {
  try {
    // Check MongoDB connection
    const start = Date.now();
    await dbConnect();
    const elapsed = Date.now() - start;
    
    return NextResponse.json({
      status: 'success',
      message: 'API and database connection healthy',
      timestamp: new Date().toISOString(),
      latency: `${elapsed}ms`,
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