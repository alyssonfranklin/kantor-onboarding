import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Department from '@/lib/mongodb/models/department.model';
import { withAuth } from '@/lib/middleware/auth';

/**
 * Create a new department
 * POST /api/departments
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    await dbConnect();

    try {
      const body = await req.json();
      
      // Validate required fields
      if (!body.company_id || !body.department_name) {
        return NextResponse.json(
          { success: false, message: 'Company ID and department name are required' },
          { status: 400 }
        );
      }
      
      // Check if user has permission for this company
      if (user.company_id !== body.company_id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to create department for this company' },
          { status: 403 }
        );
      }
      
      // Check if department already exists
      const existingDepartment = await Department.findOne({
        company_id: body.company_id,
        department_name: body.department_name
      });
      
      if (existingDepartment) {
        return NextResponse.json(
          { success: false, message: 'Department already exists' },
          { status: 409 }
        );
      }
      
      // Create new department
      const department = await Department.create({
        company_id: body.company_id,
        department_name: body.department_name,
        department_desc: body.department_desc || '',
        user_head: body.user_head || null
      });
      
      return NextResponse.json({
        success: true,
        message: 'Department created successfully',
        data: department
      });
    } catch (error) {
      console.error('Error creating department:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create department' },
        { status: 500 }
      );
    }
  });
}