import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import { withAuth } from '@/lib/middleware/auth';

/**
 * Update user password
 * PUT /api/v1/users/[id]/update-password
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, authUser) => {
    await dbConnect();
    
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
      
      // Find the user
      const user = await User.findOne({ id: params.id });
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Update the password (the pre-save hook will hash it automatically)
      user.password = body.newPassword;
      await user.save();
      
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