import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, isTokenValid } from '../mongodb/utils/jwt-utils';

interface AuthOptions {
  requiredRole?: string;
}

/**
 * Authentication middleware for Next.js API routes
 */
export async function withAuth(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: NextRequest, user: any) => Promise<NextResponse>,
  options: AuthOptions = {}
): Promise<NextResponse> {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token format and signature
    const decoded = verifyToken(token);
    
    // Check if the token exists in the database
    const isValid = await isTokenValid(token);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Token has been invalidated' },
        { status: 401 }
      );
    }
    
    // Check for required role if specified
    if (options.requiredRole && decoded.role !== options.requiredRole) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Pass the request to the handler with the decoded user info
    return handler(req, decoded);
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
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    return decoded.id as string;
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
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    return decoded.company_id as string;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return null;
  }
}