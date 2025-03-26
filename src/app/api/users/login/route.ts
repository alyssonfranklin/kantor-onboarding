import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import { generateJwtToken } from '@/lib/mongodb/utils/jwt-utils';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * User login API route
 * POST /api/users/login
 */
export async function POST(req: NextRequest) {
  try {
    // Log request details for debugging
    console.log('POST /api/users/login - Request received');
    console.log('Method:', req.method);
    console.log('Headers:', Object.fromEntries([...req.headers.entries()]));
    console.log('URL:', req.url);
    
    await dbConnect();
    console.log('POST /api/users/login - Connected to MongoDB');
    
    // Check content-type to determine how to parse the request body
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
      // Try to get the raw text as fallback
      try {
        const text = await req.text();
        console.log('Raw request body:', text);
        // Try to parse as JSON anyway
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
      } catch (e) {
        console.error('Could not read request body:', e);
        body = {};
      }
    }
    
    console.log('POST /api/users/login - Request body parsed:', { 
      hasEmail: !!body.email,
      hasPassword: !!body.password,
      contentType 
    });
    
    // Validate required fields
    if (!body.email || !body.password) {
      console.log('POST /api/users/login - Missing required fields');
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Find user by email
    console.log(`Looking for user with email: ${body.email}`);
    const user = await User.findOne({ email: body.email });
    
    if (!user) {
      console.log(`POST /api/users/login - User not found for email: ${body.email}`);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401, headers: corsHeaders }
      );
    }
    
    console.log(`Found user with email: ${body.email}`);
    console.log('User details:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });
    
    // Check password - URI decode the password first
    const decodedPassword = decodeURIComponent(body.password);
    console.log(`Comparing password: [${body.password}] (length: ${body.password.length})`);
    console.log(`Decoded password: [${decodedPassword}] (length: ${decodedPassword.length})`);
    try {
      // Try with both original and decoded password
      let isMatch = await user.comparePassword(body.password);
      if (!isMatch) {
        console.log('First attempt failed, trying with decoded password');
        isMatch = await user.comparePassword(decodedPassword);
      }
      console.log(`Password match result: ${isMatch}`);
      
      if (!isMatch) {
        console.log(`POST /api/users/login - Invalid password for user: ${body.email}`);
        return NextResponse.json(
          { success: false, message: 'Invalid credentials' },
          { status: 401, headers: corsHeaders }
        );
      }
    } catch (error) {
      console.error('Error comparing password:', error);
      return NextResponse.json(
        { success: false, message: 'Error during authentication', error: String(error) },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Generate JWT token
    const token = await generateJwtToken(user);
    
    console.log(`POST /api/users/login - Login successful for user: ${body.email}`);
    
    // Return token and user info (excluding password)
    const userObj = user.toObject();
    delete userObj.password;
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token: token,
      accessToken: token, // Add accessToken field for compatibility
      user: userObj
    }, { 
      headers: corsHeaders // Add CORS headers
    });
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Login failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Handle GET requests for backward compatibility with Google Apps Script
 * GET /api/users/login?email=xxx&password=yyy
 */
export async function GET(req: NextRequest) {
  try {
    // Log request details for debugging
    console.log('GET /api/users/login - Request received');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    await dbConnect();
    console.log('GET /api/users/login - Connected to MongoDB');
    
    // Parse URL parameters
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    const password = url.searchParams.get('password');
    
    console.log('GET /api/users/login - Parameters:', { 
      hasEmail: !!email, 
      hasPassword: !!password 
    });
    
    // Validate required parameters
    if (!email || !password) {
      console.log('GET /api/users/login - Missing required parameters');
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Find user by email
    console.log(`GET - Looking for user with email: ${email}`);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`GET /api/users/login - User not found for email: ${email}`);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401, headers: corsHeaders }
      );
    }
    
    console.log(`GET - Found user with email: ${email}`);
    console.log('GET - User details:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });
    
    // Check password - password may already be decoded since it came from URL params
    // But let's try both ways to be sure
    const decodedPassword = decodeURIComponent(password);
    console.log(`GET - Comparing password: [${password}] (length: ${password.length})`);
    console.log(`GET - Decoded password: [${decodedPassword}] (length: ${decodedPassword.length})`);
    try {
      // Try with both original and decoded password
      let isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log('GET - First attempt failed, trying with decoded password');
        isMatch = await user.comparePassword(decodedPassword);
      }
      console.log(`GET - Password match result: ${isMatch}`);
      
      if (!isMatch) {
        console.log(`GET /api/users/login - Invalid password for user: ${email}`);
        return NextResponse.json(
          { success: false, message: 'Invalid credentials' },
          { status: 401, headers: corsHeaders }
        );
      }
    } catch (error) {
      console.error('GET - Error comparing password:', error);
      return NextResponse.json(
        { success: false, message: 'Error during authentication', error: String(error) },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Generate JWT token
    const token = await generateJwtToken(user);
    
    console.log(`GET /api/users/login - Login successful for user: ${email}`);
    
    // Return token and user info (excluding password)
    const userObj = user.toObject();
    delete userObj.password;
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token: token,
      accessToken: token, // Add accessToken field for compatibility
      user: userObj
    }, { 
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error in login (GET):', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Login failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
}