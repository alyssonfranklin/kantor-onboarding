import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Employee from '@/lib/mongodb/models/employee.model';
import { withAuth } from '@/lib/middleware/auth';

// GET /api/employees/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    const { id } = await params;
    
    try {
      const employee = await Employee.findOne({ employee_id: id });
      
      if (!employee) {
        return NextResponse.json(
          { success: false, message: 'Employee not found' },
          { status: 404 }
        );
      }
      
      // Users can only access employees from their own company unless admin
      if (user.company_id !== employee.company_id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('Error getting employee:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to get employee' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/employees/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    const { id } = await params;
    
    try {
      const body = await req.json();
      
      // Find the employee first to check permissions
      const employee = await Employee.findOne({ employee_id: id });
      
      if (!employee) {
        return NextResponse.json(
          { success: false, message: 'Employee not found' },
          { status: 404 }
        );
      }
      
      // Only admins or users from the same company can update employees
      if (user.company_id !== employee.company_id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to update this employee' },
          { status: 403 }
        );
      }
      
      // Update the employee
      const updatedEmployee = await Employee.findOneAndUpdate(
        { employee_id: id },
        { 
          $set: {
            ...body,
            updated_at: new Date()
          }
        },
        { new: true, runValidators: true }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Employee updated successfully',
        data: updatedEmployee
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

// DELETE /api/employees/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    const { id } = await params;
    
    try {
      // Find the employee first to check permissions
      const employee = await Employee.findOne({ employee_id: id });
      
      if (!employee) {
        return NextResponse.json(
          { success: false, message: 'Employee not found' },
          { status: 404 }
        );
      }
      
      // Only admins or company administrators can delete employees
      if (
        (user.company_id !== employee.company_id || user.role !== 'orgadmin') 
        && user.role !== 'admin'
      ) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to delete this employee' },
          { status: 403 }
        );
      }
      
      // Delete the employee
      await Employee.deleteOne({ employee_id: id });
      
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