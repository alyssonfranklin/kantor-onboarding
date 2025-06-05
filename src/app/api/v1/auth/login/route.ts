/**
 * Authentication Login API Route
 * POST /api/v1/auth/login
 * 
 * Handles user login and token generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import { 
  generateToken, 
  setAuthCookie, 
  setRefreshCookie, 
  withCsrfProtection 
} from '@/lib/auth/index-server';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // Parse request body
    const contentType = req.headers.get('content-type');
    let body;
    
    try {
      if (contentType?.includes('application/json')) {
        body = await req.json();
      } else {
        // Handle form data or other formats
        const formData = await req.formData();
        body = Object.fromEntries(formData);
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
      // Try to get raw text as fallback
      const text = await req.text();
      console.log('Raw request body:', text);
      
      try {
        body = JSON.parse(text);
      } catch {
        // If all else fails, check URL parameters
        const url = new URL(req.url);
        const email = url.searchParams.get('email');
        const password = url.searchParams.get('password');
        
        if (email && password) {
          body = { email, password };
        } else {
          body = {};
        }
      }
    }
    
    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await User.findOne({ email: body.email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check password
    const isMatch = await user.comparePassword(body.password);
    
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate JWT token
    const token = await generateToken(user);

    return NextResponse.json(
      { success: false, message: 'Generó el token: ' + token },
      { status: 400 }
    );
    
    // Return token and user info (excluding password)
    const userObj = user.toObject();
    delete userObj.password;
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      accessToken: token, // For compatibility
      user: userObj
    });
    
    // Set authentication cookie
    setAuthCookie(response, token);
    
    // If "remember me" is enabled, set a refresh token with longer expiry
    if (body.rememberMe) {
      setRefreshCookie(response, token);
    }
    
    return response;
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Login failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Apply CSRF protection to the route
export const POST_handler = withCsrfProtection(POST);