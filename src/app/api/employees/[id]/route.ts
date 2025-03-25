import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Employee from '@/lib/mongodb/models/employee.model';
import { withAuth } from '@/lib/middleware/auth';

/**
 * Get a specific employee
 * GET /api/employees/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    const employeeId = params.id;
    
    try {
      // Find the employee
      const employee = await Employee.findOne({ employee_id: employeeId });
      
      if (!employee) {
        return NextResponse.json(
          { success: false, message: 'Employee not found' },
          { status: 404 }
        );
      }
      
      // Check if user has permission to view this employee
      if (user.company_id !== employee.company_id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to access this employee' },
          { status: 403 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Employee retrieved successfully',
        data: employee
      });
    } catch (error) {
      console.error('Error retrieving employee:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve employee' },
        { status: 500 }
      );
    }
  });
}

/**
 * Update an employee
 * PUT /api/employees/[id]
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    const employeeId = params.id;
    
    try {
      // Find the employee
      const employee = await Employee.findOne({ employee_id: employeeId });
      
      if (!employee) {
        return NextResponse.json(
          { success: false, message: 'Employee not found' },
          { status: 404 }
        );
      }
      
      // Check if user has permission to update this employee
      if (user.company_id !== employee.company_id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to update this employee' },
          { status: 403 }
        );
      }
      
      const body = await req.json();
      
      // Update employee fields
      if (body.employee_name) {
        employee.employee_name = body.employee_name;
      }
      
      if (body.employee_role !== undefined) {
        employee.employee_role = body.employee_role;
      }
      
      if (body.employee_leader !== undefined) {
        employee.employee_leader = body.employee_leader;
      }
      
      // Save the updated employee
      await employee.save();
      
      return NextResponse.json({
        success: true,
        message: 'Employee updated successfully',
        data: employee
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update employee' },
        { status: 500 }
      );
    }
  });
}

/**
 * Delete an employee
 * DELETE /api/employees/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    const employeeId = params.id;
    
    try {
      // Find the employee
      const employee = await Employee.findOne({ employee_id: employeeId });
      
      if (!employee) {
        return NextResponse.json(
          { success: false, message: 'Employee not found' },
          { status: 404 }
        );
      }
      
      // Check if user has permission to delete this employee (admin only or same company)
      if (user.company_id !== employee.company_id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to delete this employee' },
          { status: 403 }
        );
      }
      
      // Delete the employee
      await Employee.deleteOne({ employee_id: employeeId });
      
      return NextResponse.json({
        success: true,
        message: 'Employee deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete employee' },
        { status: 500 }
      );
    }
  });
}