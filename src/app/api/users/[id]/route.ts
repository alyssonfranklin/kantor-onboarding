import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import { withAuth } from '@/lib/middleware/auth';

// GET /api/users/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    const { id } = await params;
    
    try {
      // Validate authorization - users can only access their own data unless admin
      if (user.id !== id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      const userData = await User.findOne({ id })
        .select('-password');
      
      if (!userData) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: userData
      });
    } catch (error) {
      console.error('Error getting user:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to get user' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/users/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (req, authUser) => {
    await dbConnect();
    const { id } = await params;
    
    try {
      const body = await req.json();
      
      // Only admins can update other users or regular users can update their own info
      if (authUser.id !== id && authUser.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to update this user' },
          { status: 403 }
        );
      }
      
      // Find and update the user
      const updatedUser = await User.findOneAndUpdate(
        { id },
        { 
          $set: {
            ...body,
            updated_at: new Date()
          }
        },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!updatedUser) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update user' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/users/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    const { id } = await params;
    
    try {
      // Only admins can delete users
      if (user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to delete users' },
          { status: 403 }
        );
      }
      
      const result = await User.deleteOne({ id });
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete user' },
        { status: 500 }
      );
    }
  });
}