// src/app/api/add-user/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import Company from '@/lib/mongodb/models/company.model';
import Department from '@/lib/mongodb/models/department.model';
import { generateCustomId } from '@/lib/mongodb/utils/id-generator';

export async function POST(req: Request) {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    const { email, name, companyName, password, version, assistantId } = await req.json();

    // Validate required fields
    if (!email || !name || !companyName || !password || !version || !assistantId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if company or user already exists
    const existingCompany = await Company.findOne({ name: companyName });
    if (existingCompany) {
      return NextResponse.json(
        { error: 'Company name already exists' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }
    
    // Generate IDs
    const companyId = generateCustomId();
    const userId = generateCustomId();
    
    // Current timestamp
    const timestamp = new Date();

    // Debug the company data structure
    console.log('Adding company:', {
      company_id: companyId,
      name: companyName,
      assistant_id: assistantId,
      status: 'active',
      created_at: timestamp,
      updated_at: timestamp
    });

    // Create company in MongoDB
    const company = await Company.create({
      company_id: companyId,
      name: companyName,
      assistant_id: assistantId,
      status: 'active',
      created_at: timestamp,
      updated_at: timestamp
    });

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
    const user = await User.create({
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

    // Create default Management department
    await Department.create({
      company_id: companyId,
      department_name: 'Management',
      department_desc: 'Company management department',
      user_head: userId
    });

    return NextResponse.json({ 
      success: true,
      message: 'Company and user added to database successfully',
      companyId,
      userId
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