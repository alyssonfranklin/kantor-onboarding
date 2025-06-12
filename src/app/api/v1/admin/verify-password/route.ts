import { NextRequest, NextResponse } from 'next/server';

// Get the admin password from environment variables
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Rate limiting implementation
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS = 5; // 5 attempts per minute
const ipRequests = new Map<string, { count: number, resetTime: number }>();

export async function POST(req: NextRequest) {
  try {
    // Basic rate limiting by IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [storedIp, data] of ipRequests.entries()) {
      if (now > data.resetTime) {
        ipRequests.delete(storedIp);
      }
    }
    
    // Check rate limit
    const ipData = ipRequests.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    if (ipData.count >= MAX_REQUESTS) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts, please try again later' },
        { status: 429 }
      );
    }
    
    // Update rate limit counter
    ipRequests.set(ip, {
      count: ipData.count + 1,
      resetTime: ipData.resetTime
    });
    
    const { password } = await req.json();
    
    // Validate required fields
    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      );
    }

    // Check if ADMIN_PASSWORD is configured
    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD environment variable is not set');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Simple password verification
    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ 
        success: true,
        message: 'Authentication successful' 
      });
    } else {
      return NextResponse.json({ 
        success: false,
        message: 'Incorrect password'
      });
    }
  } catch (error) {
    console.error('Error verifying admin password:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
}