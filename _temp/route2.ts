import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Department from '@/lib/mongodb/models/department.model';
import { withAuth } from '@/lib/middleware/auth';

/**
 * Get all departments for a company
 * GET /api/departments/company/[companyId]
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
        { success: false, message: 'Unauthorized to access departments for this company' },
        { status: 403 }
      );
    }
    
    try {
      // Get all departments for the company
      const departments = await Department.find({ company_id: companyId });
      
      return NextResponse.json({
        success: true,
        message: 'Departments retrieved successfully',
        data: departments
      });
    } catch (error) {
      console.error('Error retrieving departments:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve departments' },
        { status: 500 }
      );
    }
  });
}