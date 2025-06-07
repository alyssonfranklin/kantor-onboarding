import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Company from '@/lib/mongodb/models/company.model';
import { withAuth } from '@/lib/middleware/auth';
import { generateId } from '@/lib/mongodb/utils/id-generator';

/**
 * Get all companies (with optional filtering)
 * GET /api/v1/companies
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    try {
      // Access control - regular users can only see their own company
      let query = {};
      if (user.role !== 'admin') {
        query = { company_id: user.company_id };
      }
      
      // Get search params
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '100', 10);
      const skip = parseInt(url.searchParams.get('skip') || '0', 10);
      
      // Add filters if provided
      if (status) {
        query = { ...query, status };
      }
      
      // Query database with pagination
      const companies = await Company.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ created_at: -1 });
        
      const total = await Company.countDocuments(query);
      
      return NextResponse.json({
        success: true,
        data: companies,
        meta: {
          total,
          limit,
          skip
        }
      });
    } catch (error) {
      console.error('Error getting companies:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to get companies' },
        { status: 500 }
      );
    }
  });
}

/**
 * Create a new company
 * POST /api/v1/companies
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    try {
      // Only admins can create new companies
      if (user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to create companies' },
          { status: 403 }
        );
      }
      
      const body = await req.json();
      
      // Validate required fields
      if (!body.name) {
        return NextResponse.json(
          { success: false, message: 'Company name is required' },
          { status: 400 }
        );
      }
      
      // Check if company already exists
      const existingCompany = await Company.findOne({ name: body.name });
      if (existingCompany) {
        return NextResponse.json(
          { success: false, message: 'Company name already exists' },
          { status: 409 }
        );
      }
      
      // Generate company ID
      const companyId = await generateId('COMP');
      const timestamp = new Date();
      
      // Create company
      const company = await Company.create({
        company_id: companyId,
        name: body.name,
        assistant_id: body.assistant_id || null,
        status: body.status || 'active',
        created_at: timestamp,
        updated_at: timestamp,
        description: body.description || ''
      });
      
      return NextResponse.json({
        success: true,
        message: 'Company created successfully',
        data: company
      });
    } catch (error) {
      console.error('Error creating company:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create company' },
        { status: 500 }
      );
    }
  });
}