import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import UsageLog from '@/lib/mongodb/models/usage-log.model';
import { withAuth } from '@/lib/middleware/auth';

/**
 * Get usage logs (with optional filtering)
 * GET /api/v1/usage-logs
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    try {
      // Access control - regular users can only see logs from their company
      let query = {};
      if (user.role !== 'admin') {
        query = { company_id: user.company_id };
      }
      
      // Get search params
      const url = new URL(req.url);
      const companyId = url.searchParams.get('companyId');
      const limit = parseInt(url.searchParams.get('limit') || '100', 10);
      const skip = parseInt(url.searchParams.get('skip') || '0', 10);
      
      // Add filters if provided
      if (companyId && (user.role === 'admin' || companyId === user.company_id)) {
        query = { ...query, company_id: companyId };
      }
      
      // Query database with pagination
      const usageLogs = await UsageLog.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ datetime: -1 }); // Most recent first
        
      const total = await UsageLog.countDocuments(query);
      
      return NextResponse.json({
        success: true,
        data: usageLogs,
        meta: {
          total,
          limit,
          skip
        }
      });
    } catch (error) {
      console.error('Error getting usage logs:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to get usage logs' },
        { status: 500 }
      );
    }
  });
}

/**
 * Create a new usage log entry
 * POST /api/v1/usage-logs
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    await dbConnect();

    try {
      const body = await req.json();
      
      // Validate required fields
      if (!body.company_id || !body.last_status_id) {
        return NextResponse.json(
          { success: false, message: 'Company ID and status ID are required' },
          { status: 400 }
        );
      }
      
      // Generate usage_id
      const usageId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if user has permission for this company
      if (user.company_id !== body.company_id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to create usage log for this company' },
          { status: 403 }
        );
      }
      
      // Create new usage log
      const usageLog = await UsageLog.create({
        usage_id: usageId,
        company_id: body.company_id,
        last_status_id: body.last_status_id,
        datetime: body.datetime || new Date()
      });
      
      return NextResponse.json({
        success: true,
        message: 'Usage log created successfully',
        data: usageLog
      });
    } catch (error) {
      console.error('Error creating usage log:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create usage log' },
        { status: 500 }
      );
    }
  });
}