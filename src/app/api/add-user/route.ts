// src/app/api/add-user/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import Company from '@/lib/mongodb/models/company.model';
import Department from '@/lib/mongodb/models/department.model';
import { generateId } from '@/lib/mongodb/utils/id-generator';

export async function POST(req: Request) {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB for add-user API...');
    try {
      await dbConnect();
      console.log('Successfully connected to MongoDB');
    } catch (connError) {
      console.error('Failed to connect to MongoDB:', connError);
      return NextResponse.json(
        { error: 'Database connection failed. Please check your MongoDB connection.' },
        { status: 500 }
      );
    }
    
    const { email, name, companyName, password, version, assistantId } = await req.json();
    console.log('Received request to add user:', { email, name, companyName, version, assistantId });

    // Validate required fields
    if (!email || !name || !companyName || !password || !version || !assistantId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if email already exists (regardless of company)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }
    
    // Check if company already exists
    let companyId;
    const timestamp = new Date();
    const existingCompany = await Company.findOne({ name: companyName });
    
    if (existingCompany) {
      // Company exists - use its ID instead of creating a new company
      console.log('Company already exists, using existing company:', existingCompany);
      companyId = existingCompany.company_id;
      
      // If assistant ID is different from what was provided, we'll update it
      if (existingCompany.assistant_id !== assistantId) {
        console.log(`Updating company assistant_id from ${existingCompany.assistant_id} to ${assistantId}`);
        await Company.findOneAndUpdate(
          { company_id: companyId },
          { 
            assistant_id: assistantId,
            updated_at: timestamp
          }
        );
      }
    } else {
      // Company doesn't exist - create a new one
      companyId = await generateId('COMP');
      
      // Debug the company data structure
      console.log('Adding new company:', {
        company_id: companyId,
        name: companyName,
        assistant_id: assistantId,
        status: 'active',
        created_at: timestamp,
        updated_at: timestamp
      });

      // Create company in MongoDB
      await Company.create({
        company_id: companyId,
        name: companyName,
        assistant_id: assistantId,
        status: 'active',
        created_at: timestamp,
        updated_at: timestamp
      });
    }
    
    // Generate user ID - always create a new user
    const userId = await generateId('USER');

    // Debug the user data structure
    console.log('Adding user:', {
      id: userId,
      email: email,
      name: name,
      company_id: companyId,
      role: 'orgadmin',
      created_at: timestamp,
      company_role: 'leader',
      department: 'Management'
    });

    // Create user in MongoDB
    await User.create({
      id: userId,
      email: email,
      name: name,
      company_id: companyId,
      role: 'orgadmin',
      created_at: timestamp,
      department: 'Management',
      company_role: 'leader',
      password: password // Password will be hashed by the pre-save hook
    });

    // Only create the Management department if specifically requested
    // Remove this if you don't want automatic department creation
    if (req.headers.get('x-create-default-department') === 'true') {
      await Department.create({
        company_id: companyId,
        department_name: 'Management',
        department_desc: 'Company management department',
        user_head: userId
      });
      console.log('Created default Management department');
    } else {
      console.log('Skipping default Management department creation');
    }

    // Prepare a more detailed success message
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
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error adding to database:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to add to database' },
      { status: 500 }
    );
  }
}