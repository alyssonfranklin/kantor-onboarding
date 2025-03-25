import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import { invalidateToken } from '@/lib/mongodb/utils/jwt-utils';

/**
 * Logout API endpoint
 * POST /api/logout
 */
export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No authentication token provided' },
        { status: 400 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Invalidate the token in the database
    const result = await invalidateToken(token);
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Logged out successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Token not found or already invalidated' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}