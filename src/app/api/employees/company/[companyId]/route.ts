import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Employee from '@/lib/mongodb/models/employee.model';
import { withAuth } from '@/lib/middleware/auth';

/**
 * Get all employees for a company
 * GET /api/employees/company/[companyId]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { companyId: string } }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    const companyId = params.companyId;
    
    // Check if user has permission for this company
    if (user.company_id !== companyId && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to access employees for this company' },
        { status: 403 }
      );
    }
    
    try {
      // Get all employees for the company
      const employees = await Employee.find({ company_id: companyId });
      
      return NextResponse.json({
        success: true,
        message: 'Employees retrieved successfully',
        data: employees
      });
    } catch (error) {
      console.error('Error retrieving employees:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve employees' },
        { status: 500 }
      );
    }
  });
}