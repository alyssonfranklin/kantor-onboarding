import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Company from '@/lib/mongodb/models/company.model';

/**
 * Get company by domain
 * GET /api/v1/companies/domain?domain=example.com
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    console.log('GET /api/v1/companies/domain - Connected to MongoDB');
    
    // Get domain from query parameters
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain');
    
    if (!domain) {
      console.log('GET /api/v1/companies/domain - No domain provided');
      return NextResponse.json(
        { success: false, message: 'Domain parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`GET /api/v1/companies/domain - Looking up company with domain: ${domain}`);
    
    // Look for the domain in domains array or domain field
    const companies = await Company.find({
      $or: [
        { domain: domain },
        { domains: domain }
      ]
    });
    
    if (!companies || companies.length === 0) {
      console.log(`GET /api/v1/companies/domain - No company found with domain: ${domain}`);
      return NextResponse.json(
        { success: false, message: 'Company not found for this domain' },
        { status: 404 }
      );
    }
    
    console.log(`GET /api/v1/companies/domain - Found company: ${companies[0].name}`);
    
    return NextResponse.json({
      success: true,
      data: companies[0]
    });
  } catch (error) {
    console.error('Error looking up company by domain:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error looking up company',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}