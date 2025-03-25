import { NextResponse } from 'next/server';
// No need for bcrypt as model handles password hashing
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import Company from '@/lib/mongodb/models/company.model';
import Department from '@/lib/mongodb/models/department.model';
import { generateId } from '@/lib/mongodb/utils/id-generator';

export async function POST() {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Check if admin user already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      return NextResponse.json({ 
        success: true,
        message: 'Database already initialized with admin user', 
        existing: true
      });
    } else {
      // Create a default admin user if none exists
      
      // Generate IDs
      const adminId = await generateId('USER');
      const companyId = await generateId('COMP');
      
      // Create default company
      await Company.create({
        company_id: companyId,
        name: 'Voxerion Inc.',
        assistant_id: 'default_assistant_id',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Create admin user with default password
      const adminPassword = 'admin123';
      await User.create({
        id: adminId,
        email: 'admin@voxerion.com',
        password: adminPassword, // Will be hashed by the pre-save hook
        name: 'System Admin',
        company_id: companyId,
        role: 'admin',
        created_at: new Date(),
        department: 'Management',
        company_role: 'Admin'
      });
      
      // Create default department
      await Department.create({
        company_id: companyId,
        department_name: 'Management',
        department_desc: 'Company management department',
        user_head: adminId
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database initialized with default admin user', 
        existing: false,
        adminEmail: 'admin@voxerion.com',
        adminPassword: adminPassword, // Return the password in the response
        companyId,
        adminId
      });
    }
  } catch (error: Error | unknown) {
    const err = error as Error;
    console.error('Error initializing database:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: err.message || 'Failed to initialize database' 
      },
      { status: 500 }
    );
  }
}