/**
 * CSRF Token API Route
 * GET /api/v1/auth/csrf
 * 
 * Generates and returns a new CSRF token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCsrfToken } from '@/lib/auth/csrf';

export async function GET(req: NextRequest) {
  try {
    // Create a new response
    let response = NextResponse.json({
      success: true,
      message: 'CSRF token generated successfully'
    });
    
    // Generate CSRF token and set it in the cookie
    const { csrfToken, response: updatedResponse } = createCsrfToken(response);
    
    // Add the token to the response body
    return NextResponse.json({
      success: true,
      message: 'CSRF token generated successfully',
      csrfToken
    }, { headers: updatedResponse.headers });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate CSRF token',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}