import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, isTokenValid } from '../mongodb/utils/jwt-utils';
import { getEnvironment, isProduction } from '../environment';

interface AuthOptions {
  requiredRole?: string;
  allowCredentials?: boolean;
}

/**
 * Authentication middleware for Next.js API routes with cross-domain support
 */
export async function withAuth(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: NextRequest, user: any) => Promise<NextResponse>,
  options: AuthOptions = {}
): Promise<NextResponse> {
  try {
    // Get the token from the Authorization header or from cookies
    const authHeader = req.headers.get('authorization');
    const cookies = req.cookies;
    const tokenFromCookie = cookies.get('auth_token')?.value;
    
    console.log(`Auth middleware - Received request to ${req.method} ${req.url}`, { 
      hasAuthHeader: !!authHeader,
      hasAuthCookie: !!tokenFromCookie,
      isBearer: authHeader?.startsWith('Bearer ') || false
    });
    
    // Determine which token to use (prefer header, fallback to cookie)
    let token: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (tokenFromCookie) {
      token = tokenFromCookie;
    }
    
    if (!token) {
      console.warn('Auth middleware - No valid authentication token found');
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the token format and signature
    console.log('Auth middleware - Verifying token');
    const decoded = verifyToken(token);
    console.log('Auth middleware - Token verified successfully', { 
      userId: decoded.id,
      userRole: decoded.role,
      companyId: decoded.company_id
    });
    
    // Check if the token exists in the database
    console.log('Auth middleware - Checking if token is valid in database');
    const isValid = await isTokenValid(token);
    
    if (!isValid) {
      console.warn('Auth middleware - Token has been invalidated');
      return NextResponse.json(
        { success: false, message: 'Token has been invalidated' },
        { status: 401 }
      );
    }
    
    // Check for required role if specified
    if (options.requiredRole && decoded.role !== options.requiredRole) {
      console.warn(`Auth middleware - Insufficient permissions: required ${options.requiredRole}, got ${decoded.role}`);
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    console.log('Auth middleware - Authentication successful, proceeding to handler');
    // Pass the request to the handler with the decoded user info
    const response = await handler(req, decoded);
    
    // If allowCredentials is true, ensure the token is also set as a cookie for cross-domain support
    if (options.allowCredentials && !response.cookies.get('auth_token')) {
      const cookieOptions = {
        // Cookie expiry should match token expiry
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: isProduction(),
        path: '/',
        sameSite: isProduction() ? 'none' as const : 'lax' as const,
        // In production, set domain to the root domain to allow sharing between subdomains
        ...(isProduction() && { domain: '.voxerion.com' }),
      };
      
      response.cookies.set('auth_token', token, cookieOptions);
    }
    
    return response;
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 401 }
    );
  }
}

/**
 * Helper function to extract user ID from authentication token
 */
export function getUserIdFromRequest(req: NextRequest): string | null {
  try {
    // Check header first
    const authHeader = req.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      return decoded.id as string;
    }
    
    // Fall back to cookie
    const tokenFromCookie = req.cookies.get('auth_token')?.value;
    if (tokenFromCookie) {
      const decoded = verifyToken(tokenFromCookie);
      return decoded.id as string;
    }
    
    return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return null;
  }
}

/**
 * Helper function to extract company ID from authentication token
 */
export function getCompanyIdFromRequest(req: NextRequest): string | null {
  try {
    // Check header first
    const authHeader = req.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      return decoded.company_id as string;
    }
    
    // Fall back to cookie
    const tokenFromCookie = req.cookies.get('auth_token')?.value;
    if (tokenFromCookie) {
      const decoded = verifyToken(tokenFromCookie);
      return decoded.company_id as string;
    }
    
    return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return null;
  }
}