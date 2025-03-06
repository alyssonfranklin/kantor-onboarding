// src/app/api/verify-password/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Rate limiting implementation
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS = 5; // 5 attempts per minute
const ipRequests = new Map<string, { count: number, resetTime: number }>();

// Constant-time string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b.padEnd(a.length, '\0'), 'utf8')
  );
}

export async function POST(req: Request) {
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
        { error: 'Too many attempts, please try again later' },
        { status: 429 }
      );
    }
    
    // Update rate limit counter
    ipRequests.set(ip, {
      count: ipData.count + 1,
      resetTime: ipData.resetTime
    });
    
    const { password } = await req.json();
    
    // Get password from environment variable
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify the password using constant-time comparison
    const isCorrect = safeCompare(password, correctPassword);

    // Set CORS headers
    const headers = new Headers();
    headers.append('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
    headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.append('Access-Control-Allow-Headers', 'Content-Type');

    return NextResponse.json({ 
      success: isCorrect
    }, { headers });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error verifying password:', err);
    return NextResponse.json(
      { error: 'Failed to verify password' }, // Don't expose specific error messages
      { status: 500 }
    );
  }
}