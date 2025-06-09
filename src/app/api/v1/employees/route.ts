import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Employee from '@/lib/mongodb/models/employee.model';
import { withAuth } from '@/lib/middleware/auth';
import { generateId } from '@/lib/mongodb/utils/id-generator';

/**
 * Get all employees (with optional filtering)
 * GET /api/v1/employees
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    try {
      // Access control - regular users can only see employees from their company
      let query = {};
      if (user.role !== 'admin') {
        query = { company_id: user.company_id };
      }
      
      // Get search params
      const url = new URL(req.url);
      const companyId = url.searchParams.get('companyId');
      const role = url.searchParams.get('role');
      const limit = parseInt(url.searchParams.get('limit') || '100', 10);
      const skip = parseInt(url.searchParams.get('skip') || '0', 10);
      
      // Add filters if provided
      if (companyId && (user.role === 'admin' || companyId === user.company_id)) {
        query = { ...query, company_id: companyId };
      }
      
      if (role) {
        query = { ...query, employee_role: role };
      }
      
      // Query database with pagination
      const employees = await Employee.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 });
        
      const total = await Employee.countDocuments(query);
      
      return NextResponse.json({
        success: true,
        data: employees,
        meta: {
          total,
          limit,
          skip
        }
      });
    } catch (error) {
      console.error('Error getting employees:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to get employees' },
        { status: 500 }
      );
    }
  });
}

/**
 * Create a new employee
 * POST /api/v1/employees
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    await dbConnect();

    try {
      const body = await req.json();
      
      // Validate required fields
      if (!body.employee_name || !body.company_id) {
        return NextResponse.json(
          { success: false, message: 'Employee name and company ID are required' },
          { status: 400 }
        );
      }
      
      // Check if user has permission for this company
      if (user.company_id !== body.company_id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to create employee for this company' },
          { status: 403 }
        );
      }
      
      // Generate a unique employee ID
      const employee_id = await generateId('EMP');
      
      // Create new employee
      const employee = await Employee.create({
        employee_id,
        employee_name: body.employee_name,
        employee_role: body.employee_role || 'employee',
        employee_leader: body.employee_leader || null,
        company_id: body.company_id
      });
      
      return NextResponse.json({
        success: true,
        message: 'Employee created successfully',
        data: employee
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create employee' },
        { status: 500 }
      );
    }
  });
}