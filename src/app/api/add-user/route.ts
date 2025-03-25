// src/app/api/add-user/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateCustomId } from '../../../server/utils/id-generator';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Database } from '../../../server/types/db.types';
import path from 'path';
import fs from 'fs';

// Initialize database
const DB_PATH = process.env.DB_PATH || './data';

// Ensure the data directory exists
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
  console.log(`Created database directory at ${DB_PATH}`);
}

// Initialize default data
const defaultData: Database = {
  users: [],
  companies: [],
  accessTokens: [],
  departments: [],
  employees: []
};

// Create the database adapter
const adapter = new JSONFile<Database>(path.join(DB_PATH, 'db.json'));
const db = new Low<Database>(adapter, defaultData);

// Initialize the database
const initDb = async (): Promise<Low<Database>> => {
  try {
    // Read data from JSON file
    await db.read();
    
    // If the file doesn't exist yet or is empty, write default data
    if (!db.data) {
      db.data = defaultData;
      await db.write();
      console.log('Initialized empty database with default schema');
    }
    
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export async function POST(req: Request) {
  try {
    const { email, name, companyName, password, version, assistantId } = await req.json();

    // Validate required fields
    if (!email || !name || !companyName || !password || !version || !assistantId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Initialize database
    await initDb();
    
    // Generate IDs
    const companyId = generateCustomId();
    const userId = generateCustomId();
    
    // Current timestamp
    const timestamp = new Date().toISOString();

    // Debug the company data structure
    console.log('Adding company:', {
      company_id: companyId,
      name: companyName,
      assistant_id: assistantId,
      status: 'active',
      created_at: timestamp,
      updated_at: timestamp
    });

    // Create company record
    if (db.data) {
      // Check if company with same name already exists
      const existingCompany = db.data.companies.find(company => company.name === companyName);
      if (existingCompany) {
        return NextResponse.json(
          { error: 'Company name already exists' },
          { status: 400 }
        );
      }
      
      // Create new company
      db.data.companies.push({
        company_id: companyId,
        name: companyName,
        assistant_id: assistantId,
        status: 'active',
        created_at: timestamp,
        updated_at: timestamp
      });
    }

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

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user record
    if (db.data) {
      // Check if user with same email already exists
      const existingUser = db.data.users.find(user => user.email === email);
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
      
      // Create new user
      db.data.users.push({
        id: userId,
        email: email,
        name: name,
        company_id: companyId,
        role: 'orgadmin',
        created_at: timestamp,
        department: 'Management',
        company_role: 'leader',
        password: hashedPassword
      });
      
      // Write changes to database
      await db.write();
    }

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