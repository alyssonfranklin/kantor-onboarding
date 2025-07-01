import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, { companyId }) => {
    try {
      await connectToDatabase();

      // Aggregate pipeline to count employees and leaders per department
      const departmentStats = await User.aggregate([
        // Match users from the same company
        { $match: { company_id: companyId } },
        
        // Group by department
        {
          $group: {
            _id: '$department',
            totalEmployees: { $sum: 1 },
            leaders: {
              $sum: {
                $cond: [
                  { $eq: ['$id', '$reports_to'] }, // Leader condition: id equals reports_to
                  1,
                  0
                ]
              }
            }
          }
        },
        
        // Sort by department name
        { $sort: { _id: 1 } },
        
        // Rename _id to department for cleaner output
        {
          $project: {
            _id: 0,
            department: '$_id',
            totalEmployees: 1,
            leaders: 1
          }
        }
      ]);

      return NextResponse.json({
        success: true,
        data: departmentStats
      });

    } catch (error) {
      console.error('Error fetching department statistics:', error);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}