import { NextResponse } from 'next/server';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { generateCustomId } from '../../../../server/utils/id-generator';

// Define database structure
type Database = {
  users: any[];
  companies: any[];
  accessTokens: any[];
  departments: any[];
  employees: any[];
};

export async function POST(req: Request) {
  try {
    // Define the database file path
    const DB_PATH = process.env.DB_PATH || './data';

    // Ensure the data directory exists
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(DB_PATH, { recursive: true });
      console.log(`Created database directory at ${DB_PATH}`);
    }

    const dbPath = path.join(DB_PATH, 'db.json');
    const dbExists = fs.existsSync(dbPath);

    // Initialize default data structure
    const defaultData: Database = {
      users: [],
      companies: [],
      accessTokens: [],
      departments: [],
      employees: []
    };

    // Create the database adapter
    const adapter = new JSONFile<Database>(dbPath);
    const db = new Low<Database>(adapter, defaultData);

    // If the database exists, read it first
    if (dbExists) {
      await db.read();
      
      // If the database is empty or doesn't have the expected structure, initialize it
      if (!db.data || !db.data.users || !db.data.companies) {
        db.data = defaultData;
        await db.write();
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'Database structure verified', 
        existing: true
      });
    } else {
      // Create a default admin user if the database doesn't exist
      
      // Generate IDs
      const adminId = generateCustomId();
      const companyId = generateCustomId();
      
      // Current timestamp
      const timestamp = new Date().toISOString();
      
      // Create admin user
      const adminPassword = 'admin123'; // Default password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      defaultData.users.push({
        id: adminId,
        email: 'admin@voxerion.com',
        name: 'System Admin',
        company_id: companyId,
        role: 'admin',
        created_at: timestamp,
        department: 'Management',
        company_role: 'Admin',
        password: hashedPassword
      });
      
      // Create default company
      defaultData.companies.push({
        company_id: companyId,
        name: 'Voxerion Inc.',
        assistant_id: 'default_assistant_id',
        status: 'active',
        created_at: timestamp,
        updated_at: timestamp
      });
      
      // Create default department
      defaultData.departments.push({
        company_id: companyId,
        department_name: 'Management',
        department_desc: 'Company management department',
        user_head: adminId
      });
      
      // Write to database
      db.data = defaultData;
      await db.write();
      
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
  } catch (error: any) {
    console.error('Error initializing database:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to initialize database' 
      },
      { status: 500 }
    );
  }
}