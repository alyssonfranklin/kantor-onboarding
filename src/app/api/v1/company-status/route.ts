import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import UsageLog from '@/lib/mongodb/models/usage-log.model';
import Company from '@/lib/mongodb/models/company.model';
import { withAuth } from '@/lib/middleware/auth';

/**
 * Get current company status
 * GET /api/v1/company-status?companyId={company_id}
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    try {
      // Get search params
      const url = new URL(req.url);
      let companyId = url.searchParams.get('companyId');
      
      // If no companyId provided, use user's company (for logged users)
      if (!companyId && user.company_id) {
        companyId = user.company_id;
      }
      
      // For non-admin users, they can only check their own company status
      if (user.role !== 'admin' && companyId !== user.company_id) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to view this company status' },
          { status: 403 }
        );
      }
      
      if (!companyId) {
        return NextResponse.json(
          { success: false, message: 'Company ID is required' },
          { status: 400 }
        );
      }
      
      // Get company information
      const company = await Company.findOne({ company_id: companyId });
      if (!company) {
        return NextResponse.json(
          { success: false, message: 'Company not found' },
          { status: 404 }
        );
      }
      
      // Get latest status from usage logs
      const latestLog = await UsageLog.findOne({ company_id: companyId })
        .sort({ datetime: -1 }) // Most recent first
        .limit(1);
      
      // Get all status history for progress tracking
      const statusHistory = await UsageLog.find({ company_id: companyId })
        .sort({ datetime: -1 })
        .limit(10); // Last 10 status changes
      
      // Map status codes to readable descriptions
      const getStatusInfo = (statusId: string) => {
        const statusMap = {
          '6233-832932-1313': {
            name: 'Account Created',
            description: 'Company account and admin user have been created',
            step: 1,
            completed: true
          },
          '6123-98712312-8923': {
            name: 'Onboarding Completed',
            description: 'Company information and assistant instructions have been configured',
            step: 2,
            completed: true
          },
          '8290-90232442-0233': {
            name: 'Department Created',
            description: 'First department has been created',
            step: 3,
            completed: true
          },
          '6723-09823413-0002': {
            name: 'User Created',
            description: 'Additional users have been added to the company',
            step: 4,
            completed: true
          }
        };
        
        return statusMap[statusId as keyof typeof statusMap] || {
          name: 'Unknown Status',
          description: `Status code: ${statusId}`,
          step: 0,
          completed: false
        };
      };
      
      // Determine overall progress
      const completedStatuses = statusHistory.map(log => log.last_status_id);
      const allStatuses = ['6233-832932-1313', '6123-98712312-8923', '8290-90232442-0233', '6723-09823413-0002'];
      
      const progress = allStatuses.map(statusId => ({
        ...getStatusInfo(statusId),
        statusId,
        completed: completedStatuses.includes(statusId),
        completedAt: statusHistory.find(log => log.last_status_id === statusId)?.datetime || null
      }));
      
      const currentStatus = latestLog ? getStatusInfo(latestLog.last_status_id) : null;
      const progressPercentage = Math.round((completedStatuses.length / allStatuses.length) * 100);
      
      return NextResponse.json({
        success: true,
        data: {
          company: {
            company_id: company.company_id,
            name: company.name,
            status: company.status,
            created_at: company.created_at
          },
          currentStatus: currentStatus ? {
            ...currentStatus,
            statusId: latestLog?.last_status_id,
            lastUpdated: latestLog?.datetime
          } : null,
          progress: {
            percentage: progressPercentage,
            completedSteps: completedStatuses.length,
            totalSteps: allStatuses.length,
            steps: progress
          },
          statusHistory: statusHistory.map(log => ({
            statusId: log.last_status_id,
            ...getStatusInfo(log.last_status_id),
            datetime: log.datetime
          }))
        }
      });
    } catch (error) {
      console.error('Error getting company status:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to get company status' },
        { status: 500 }
      );
    }
  });
}