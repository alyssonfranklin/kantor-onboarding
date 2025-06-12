// src/app/api/v1/add-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import { User } from '@/lib/mongodb/models/user.model';
import { Company } from '@/lib/mongodb/models/company.model';
import { Department } from '@/lib/mongodb/models/department.model';
import { generateUniqueId } from '@/lib/mongodb/utils/id-generator';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { email, name, companyName, password, version, role, assistantId } = await request.json();
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

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check if company exists
    let company = await Company.findOne({ name: companyName });
    let companyWasExisting = true;

    if (!company) {
      // Create new company
      const companyId = generateUniqueId();
      company = new Company({
        companyId,
        name: companyName,
        version: version || 'Free',
        assistantId: assistantId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await company.save();
      companyWasExisting = false;

      // Create default Management department if requested
      if (createDefaultDepartment) {
        const departmentId = generateUniqueId();
        const department = new Department({
          departmentId,
          name: 'Management',
          companyId: company.companyId,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await department.save();
      }
    }

    // Create user
    const userId = generateUniqueId();
    const user = new User({
      userId,
      email,
      name,
      password: hashedPassword,
      companyId: company.companyId,
      role: role || 'orgadmin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await user.save();

    // Return response without sensitive data
    return NextResponse.json({
      success: true,
      userId: user.userId,
      companyId: company.companyId,
      companyWasExisting,
      message: 'User and company created successfully'
    });

  } catch (error) {
    console.error('Error creating user and company:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}