import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Employee from '@/lib/mongodb/models/employee.model';
import { withAuth } from '@/lib/middleware/auth';
import { generateId } from '@/lib/mongodb/utils/id-generator';

/**
 * Create a new employee
 * POST /api/employees
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    await dbConnect();

    try {
      const body = await req.json();
      
      // Validate required fields
      if (!body.employee_name || !body.company_id) {
        return NextResponse.json(
          { success: false, message: 'Employee name and company ID are required' },
          { status: 400 }
        );
      }
      
      // Check if user has permission for this company
      if (user.company_id !== body.company_id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to create employee for this company' },
          { status: 403 }
        );
      }
      
      // Generate a unique employee ID
      const employee_id = await generateId('EMP');
      
      // Create new employee
      const employee = await Employee.create({
        employee_id,
        employee_name: body.employee_name,
        employee_role: body.employee_role || null,
        employee_leader: body.employee_leader || null,
        company_id: body.company_id
      });
      
      return NextResponse.json({
        success: true,
        message: 'Employee created successfully',
        data: employee
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create employee' },
        { status: 500 }
      );
    }
  });
}