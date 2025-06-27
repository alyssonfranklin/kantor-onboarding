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
  // Temporarily remove auth for debugging
  await dbConnect();
  
  try {
    // Get search params
    const url = new URL(req.url);
    let companyId = url.searchParams.get('companyId');
    
    console.log('Company status API called with companyId:', companyId);
    
    if (!companyId) {
      return NextResponse.json(
        { success: false, message: 'Company ID is required' },
        { status: 400 }
      );
    }
      
    // Get company information
    console.log('Looking for company with company_id:', companyId);
    const company = await Company.findOne({ company_id: companyId });
    console.log('Company found:', company ? 'Yes' : 'No');
    
    if (!company) {
      // Let's also check what companies exist
      const allCompanies = await Company.find({}, { company_id: 1, name: 1 }).limit(5);
      console.log('Available companies:', allCompanies);
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Company not found',
          debug: {
            searchedFor: companyId,
            availableCompanies: allCompanies
          }
        },
        { status: 404 }
      );
    }
    
    // Get latest status from usage logs
    console.log('Looking for usage logs for company:', companyId);
    const latestLog = await UsageLog.findOne({ company_id: companyId })
      .sort({ datetime: -1 }) // Most recent first
      .limit(1);
    console.log('Latest log found:', latestLog ? 'Yes' : 'No');
    
    // Get all status history for progress tracking
    const statusHistory = await UsageLog.find({ company_id: companyId })
      .sort({ datetime: -1 })
      .limit(10); // Last 10 status changes
    console.log('Status history count:', statusHistory.length);
      
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
    
    const responseData = {
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
    };
    
    console.log('Returning response data:', JSON.stringify(responseData, null, 2));
    
    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error getting company status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get company status' },
      { status: 500 }
    );
  }
}