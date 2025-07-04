// src/app/api/v1/add-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import Company from '@/lib/mongodb/models/company.model';
import Department from '@/lib/mongodb/models/department.model';
import Insight from '@/lib/mongodb/models/insight.model';
import { generateId } from '@/lib/mongodb/utils/id-generator';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { email, name, companyName, password, version, role, assistantId, department, company_role } = await request.json();
    const createDefaultDepartment = request.headers.get('x-create-default-department') === 'true';

    // Validate required fields
    if (!email || !name || !companyName || !password) {
      return NextResponse.json(
        { error: 'Email, name, company name, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }


    // Check if company exists
    const timestamp = new Date();
    const existingCompany = await Company.findOne({ name: companyName });
    let companyId;
    
    if (existingCompany) {
      // Company exists - use its ID
      companyId = existingCompany.company_id;
      
      // Update assistant ID and subscription if different
      const updateFields: any = { updated_at: timestamp };
      
      if (existingCompany.assistant_id !== assistantId) {
        updateFields.assistant_id = assistantId;
      }
      
      if (version && existingCompany.company_subscription !== version) {
        updateFields.company_subscription = version;
      }
      
      if (Object.keys(updateFields).length > 1) { // More than just updated_at
        await Company.findOneAndUpdate(
          { company_id: companyId },
          updateFields
        );
      }
    } else {
      // Company doesn't exist - create a new one
      companyId = await generateId('COMP');
      
      await Company.create({
        company_id: companyId,
        name: companyName,
        assistant_id: assistantId,
        company_subscription: version || null,
        status: 'active',
        created_at: timestamp,
        updated_at: timestamp
      });
      
      // Create default Management department if requested
      if (createDefaultDepartment) {
        await Department.create({
          company_id: companyId,
          department_name: 'Management',
          department_desc: 'Company management department',
          user_head: null // Will be updated after user creation
        });
      }
    }

    // Get company subscription details to set user insights
    let userInsightsLeft = 1;  // Default fallback
    let userInsightsDay = 1;   // Default fallback
    
    // Use existing company object if available, otherwise look up the newly created company
    let companySubscription = null;
    if (existingCompany && existingCompany.company_subscription) {
      companySubscription = existingCompany.company_subscription;
    } else if (version) {
      // For new companies, use the version (insight_id) passed in
      companySubscription = version;
    }
    
    if (companySubscription) {
      try {
        const insightPlan = await Insight.findOne({ insight_id: companySubscription });
        if (insightPlan) {
          // Both insightsLeft and insightsDay get the SAME value from insights_day
          const insightsValue = insightPlan.insights_day || 1;
          userInsightsLeft = insightsValue;
          userInsightsDay = insightsValue;
        } else {
          console.log(`No insight plan found for subscription ID: ${companySubscription}`);
        }
      } catch (error) {
        console.error('Error fetching insight plan:', error);
        // Use defaults if insight lookup fails
      }
    } else {
      console.log(`No company subscription found, using defaults`);
    }

    // Create user
    const userId = await generateId('USER');

    await User.create({
      id: userId,
      email: email,
      name: name,
      company_id: companyId,
      role: role || 'orgadmin',
      created_at: timestamp,
      department: department || 'Management',
      company_role: company_role || 'Employee',
      insightsLeft: userInsightsLeft,
      insightsDay: userInsightsDay,
      password: password // Password will be hashed by the pre-save hook
    });

    // Return response without sensitive data
    const wasExistingCompany = !!existingCompany;
    
    return NextResponse.json({
      success: true,
      message: wasExistingCompany 
        ? 'User added to existing company successfully' 
        : 'Company and user added to database successfully',
      companyId,
      userId,
      companyWasExisting: wasExistingCompany
    });

  } catch (error) {
    console.error('Error creating user and company:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}