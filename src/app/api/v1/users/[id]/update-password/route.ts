import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import { withAuth } from '@/lib/middleware/auth';
import bcrypt from 'bcryptjs';

/**
 * Update user password
 * PUT /api/v1/users/[id]/update-password
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (req, authUser) => {
    try {
      await dbConnect();
      const { id } = await params;
    } catch (error) {
      console.error('Database connection failed:', error);
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 503 }
      );
    }
    
    try {
      const body = await req.json();
      
      // Validate required fields
      if (!body.newPassword) {
        return NextResponse.json(
          { success: false, message: 'New password is required' },
          { status: 400 }
        );
      }

      // Validate password strength (basic validation)
      if (body.newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      
      // Only admins can update other users' passwords
      if (authUser.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to update user passwords' },
          { status: 403 }
        );
      }
      
      // Hash the password first
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(body.newPassword, salt);
      
      // Update only the password field using MongoDB's updateOne to avoid validation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Update operation timeout')), 10000);
      });
      
      const updateOperation = User.updateOne(
        { id: id },
        { 
          $set: { 
            password: hashedPassword,
            updated_at: new Date()
          }
        }
      );
      
      const result = await Promise.race([updateOperation, timeoutPromise]);
      
      // Check if the user was found and updated
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Error updating password:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update password' },
        { status: 500 }
      );
    }
  });
}