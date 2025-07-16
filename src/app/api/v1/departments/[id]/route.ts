import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Department from '@/lib/mongodb/models/department.model';
import { withAuth } from '@/lib/middleware/auth';

// GET /api/departments/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    const { id } = await params;
    
    try {
      // Either get a specific department by name or department ID
      const department = await Department.findOne({
        $or: [
          { department_name: id },
          { _id: id }
        ]
      });
      
      if (!department) {
        return NextResponse.json(
          { success: false, message: 'Department not found' },
          { status: 404 }
        );
      }
      
      // Users can only access departments from their own company unless admin
      if (user.company_id !== department.company_id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: department
      });
    } catch (error) {
      console.error('Error getting department:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to get department' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/departments/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    const { id } = await params;
    
    try {
      const body = await req.json();
      
      // Find the department first to check permissions
      const department = await Department.findOne({
        $or: [
          { department_name: id },
          { _id: id }
        ]
      });
      
      if (!department) {
        return NextResponse.json(
          { success: false, message: 'Department not found' },
          { status: 404 }
        );
      }
      
      // Only admins or users from the same company can update departments
      if (user.company_id !== department.company_id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to update this department' },
          { status: 403 }
        );
      }
      
      // Update the department
      const updatedDepartment = await Department.findOneAndUpdate(
        {
          $or: [
            { department_name: id },
            { _id: id }
          ]
        },
        { $set: body },
        { new: true, runValidators: true }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Department updated successfully',
        data: updatedDepartment
      });
    } catch (error) {
      console.error('Error updating department:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update department' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/departments/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    const { id } = await params;
    
    try {
      // Find the department first to check permissions
      const department = await Department.findOne({
        $or: [
          { department_name: id },
          { _id: id }
        ]
      });
      
      if (!department) {
        return NextResponse.json(
          { success: false, message: 'Department not found' },
          { status: 404 }
        );
      }
      
      // Only admins or company administrators can delete departments
      if (
        (user.company_id !== department.company_id || user.role !== 'orgadmin') 
        && user.role !== 'admin'
      ) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to delete this department' },
          { status: 403 }
        );
      }
      
      // Delete the department
      const result = await Department.deleteOne({
        $or: [
          { department_name: id },
          { _id: id }
        ]
      });
      
      return NextResponse.json({
        success: true,
        message: 'Department deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete department' },
        { status: 500 }
      );
    }
  });
}