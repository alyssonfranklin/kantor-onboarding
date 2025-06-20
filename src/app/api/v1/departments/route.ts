import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Department from '@/lib/mongodb/models/department.model';
import { withAuth } from '@/lib/middleware/auth';

/**
 * Get departments (with optional filtering)
 * GET /api/v1/departments
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    try {
      // Access control - regular users can only see departments from their company
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
      const departments = await Department.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ department_name: 1 });
        
      const total = await Department.countDocuments(query);
      
      return NextResponse.json({
        success: true,
        data: departments,
        meta: {
          total,
          limit,
          skip
        }
      });
    } catch (error) {
      console.error('Error getting departments:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to get departments' },
        { status: 500 }
      );
    }
  });
}

/**
 * Create a new department
 * POST /api/v1/departments
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    await dbConnect();

    try {
      const body = await req.json();
      
      // Validate required fields
      if (!body.company_id || !body.department_name) {
        return NextResponse.json(
          { success: false, message: 'Company ID and department name are required' },
          { status: 400 }
        );
      }
      
      // Check if user has permission for this company
      if (user.company_id !== body.company_id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to create department for this company' },
          { status: 403 }
        );
      }
      
      // Check if department already exists
      const existingDepartment = await Department.findOne({
        company_id: body.company_id,
        department_name: body.department_name
      });
      
      if (existingDepartment) {
        return NextResponse.json(
          { success: false, message: 'Department already exists' },
          { status: 409 }
        );
      }
      
      // Create new department
      const department = await Department.create({
        company_id: body.company_id,
        department_name: body.department_name,
        department_desc: body.department_desc || '',
        user_head: body.user_head || null
      });
      
      return NextResponse.json({
        success: true,
        message: 'Department created successfully',
        data: department
      });
    } catch (error) {
      console.error('Error creating department:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create department' },
        { status: 500 }
      );
    }
  });
}