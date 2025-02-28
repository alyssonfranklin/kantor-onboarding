// src/app/api/verify-password/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
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

    // Verify the password
    const isCorrect = password === correctPassword;

    return NextResponse.json({ 
      success: isCorrect
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error verifying password:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to verify password' },
      { status: 500 }
    );
  }
}