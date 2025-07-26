import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('🧪 Test vector files API called');
  
  return NextResponse.json({
    success: true,
    message: 'Test API working',
    timestamp: new Date().toISOString(),
    url: req.url
  });
}