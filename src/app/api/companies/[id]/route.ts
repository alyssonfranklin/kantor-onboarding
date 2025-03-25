import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Company from '@/lib/mongodb/models/company.model';
import { withAuth } from '@/lib/middleware/auth';

// GET /api/companies/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    try {
      // Validate authorization - users can only access their own company unless admin
      if (user.company_id !== params.id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      const company = await Company.findOne({ company_id: params.id });
      
      if (!company) {
        return NextResponse.json(
          { success: false, message: 'Company not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: company
      });
    } catch (error) {
      console.error('Error getting company:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to get company' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/companies/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    try {
      const body = await req.json();
      
      // Only admins or company administrators can update company details
      if (user.company_id !== params.id && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to update this company' },
          { status: 403 }
        );
      }
      
      // Find and update the company
      const updatedCompany = await Company.findOneAndUpdate(
        { company_id: params.id },
        { 
          $set: {
            ...body,
            updated_at: new Date()
          }
        },
        { new: true, runValidators: true }
      );
      
      if (!updatedCompany) {
        return NextResponse.json(
          { success: false, message: 'Company not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Company updated successfully',
        data: updatedCompany
      });
    } catch (error) {
      console.error('Error updating company:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update company' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/companies/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    try {
      // Only admins can delete companies
      if (user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to delete companies' },
          { status: 403 }
        );
      }
      
      const result = await Company.deleteOne({ company_id: params.id });
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'Company not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Company deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting company:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete company' },
        { status: 500 }
      );
    }
  });
}