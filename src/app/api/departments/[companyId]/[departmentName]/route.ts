import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Department from '@/lib/mongodb/models/department.model';
import { withAuth } from '@/lib/middleware/auth';

interface DepartmentParams {
  companyId: string;
  departmentName: string;
}

/**
 * Get a specific department
 * GET /api/departments/[companyId]/[departmentName]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: DepartmentParams }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    const { companyId, departmentName } = params;
    
    // Check if user has permission for this company
    if (user.company_id !== companyId && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to access this department' },
        { status: 403 }
      );
    }
    
    try {
      // Find the department
      const department = await Department.findOne({
        company_id: companyId,
        department_name: departmentName
      });
      
      if (!department) {
        return NextResponse.json(
          { success: false, message: 'Department not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Department retrieved successfully',
        data: department
      });
    } catch (error) {
      console.error('Error retrieving department:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve department' },
        { status: 500 }
      );
    }
  });
}

/**
 * Update a department
 * PUT /api/departments/[companyId]/[departmentName]
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: DepartmentParams }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    const { companyId, departmentName } = params;
    
    // Check if user has permission for this company
    if (user.company_id !== companyId && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to update this department' },
        { status: 403 }
      );
    }
    
    try {
      const body = await req.json();
      
      // Find the department
      const department = await Department.findOne({
        company_id: companyId,
        department_name: departmentName
      });
      
      if (!department) {
        return NextResponse.json(
          { success: false, message: 'Department not found' },
          { status: 404 }
        );
      }
      
      // Update department fields
      if (body.department_desc !== undefined) {
        department.department_desc = body.department_desc;
      }
      
      if (body.user_head !== undefined) {
        department.user_head = body.user_head;
      }
      
      // Save the updated department
      await department.save();
      
      return NextResponse.json({
        success: true,
        message: 'Department updated successfully',
        data: department
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

/**
 * Delete a department
 * DELETE /api/departments/[companyId]/[departmentName]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: DepartmentParams }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    const { companyId, departmentName } = params;
    
    // Check if user has permission for this company (admin only)
    if (user.role !== 'admin' && user.company_id !== companyId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to delete this department' },
        { status: 403 }
      );
    }
    
    try {
      // Delete the department
      const result = await Department.deleteOne({
        company_id: companyId,
        department_name: departmentName
      });
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'Department not found' },
          { status: 404 }
        );
      }
      
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