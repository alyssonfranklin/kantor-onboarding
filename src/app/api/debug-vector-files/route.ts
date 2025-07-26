import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('🔍 DEBUG: Vector files API called:', req.url);
  console.log('🔍 DEBUG: Headers:', Object.fromEntries(req.headers.entries()));
  console.log('🔍 DEBUG: Method:', req.method);
  
  try {
    const url = new URL(req.url);
    const companyId = url.searchParams.get('companyId');
    
    console.log('🔍 DEBUG: Company ID:', companyId);
    
    return NextResponse.json({
      success: true,
      message: 'Debug endpoint working',
      timestamp: new Date().toISOString(),
      url: req.url,
      companyId,
      headers: Object.fromEntries(req.headers.entries())
    });
  } catch (error) {
    console.error('🚨 DEBUG: Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}