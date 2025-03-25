import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Employee from '@/lib/mongodb/models/employee.model';
import { withAuth } from '@/lib/middleware/auth';

/**
 * Get all employees by leader
 * GET /api/employees/leader/[leaderId]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { leaderId: string } }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    const leaderId = params.leaderId;
    
    try {
      // Get all employees for the leader
      const employees = await Employee.find({ employee_leader: leaderId });
      
      // Check if user has permission to view these employees
      // Either the user is the leader, admin, or same company
      const hasPermission = 
        user.id === leaderId || 
        user.role === 'admin' || 
        (employees.length > 0 && employees[0].company_id === user.company_id);
      
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to access these employees' },
          { status: 403 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Employees retrieved successfully',
        data: employees
      });
    } catch (error) {
      console.error('Error retrieving employees by leader:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve employees' },
        { status: 500 }
      );
    }
  });
}