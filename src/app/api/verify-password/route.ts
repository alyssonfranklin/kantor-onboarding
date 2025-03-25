// src/app/api/verify-password/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import { generateToken } from '@/lib/mongodb/utils/jwt-utils';

// Rate limiting implementation
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS = 5; // 5 attempts per minute
const ipRequests = new Map<string, { count: number, resetTime: number }>();

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
    
    const { email, password } = await req.json();
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await dbConnect();
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal that the email doesn't exist
      return NextResponse.json({ 
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify the password using the model method
    const isCorrect = await user.comparePassword(password);

    // Set CORS headers
    const headers = new Headers();
    headers.append('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
    headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.append('Access-Control-Allow-Headers', 'Content-Type');

    if (isCorrect) {
      // Generate JWT token
      const token = await generateToken(user);
      
      // Return user data (without password) and token
      const userObj = user.toObject();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = userObj;
      
      return NextResponse.json({ 
        success: true,
        user: userWithoutPassword,
        token
      }, { headers });
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid email or password'
      }, { headers });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error verifying password:', err);
    return NextResponse.json(
      { error: 'Failed to verify password' }, // Don't expose specific error messages
      { status: 500 }
    );
  }
}