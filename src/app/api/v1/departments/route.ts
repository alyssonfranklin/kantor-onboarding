import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Department from '@/lib/mongodb/models/department.model';
import User from '@/lib/mongodb/models/user.model';
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
        
      // Populate department_lead with user names
      const departmentsWithLeadNames = await Promise.all(
        departments.map(async (dept) => {
          const deptObj = dept.toObject();
          if (deptObj.department_lead) {
            try {
              const leadUser = await User.findById(deptObj.department_lead);
              deptObj.department_lead_name = leadUser ? leadUser.name : 'Unknown User';
              deptObj.department_lead_id = deptObj.department_lead; // Keep original ID for editing
            } catch (error) {
              deptObj.department_lead_name = 'Unknown User';
              deptObj.department_lead_id = deptObj.department_lead;
            }
          } else {
            deptObj.department_lead_name = null;
            deptObj.department_lead_id = null;
          }
          return deptObj;
        })
      );
        
      const total = await Department.countDocuments(query);
      
      return NextResponse.json({
        success: true,
        data: departmentsWithLeadNames,
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
      
      // Generate department_id
      const departmentId = `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
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
        department_id: departmentId,
        company_id: body.company_id,
        department_name: body.department_name,
        department_description: body.department_description || null,
        department_lead: body.department_lead || null
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