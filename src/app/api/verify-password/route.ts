// src/app/api/verify-password/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Database } from '../../../server/types/db.types';
import path from 'path';
import fs from 'fs';

// Rate limiting implementation
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS = 5; // 5 attempts per minute
const ipRequests = new Map<string, { count: number, resetTime: number }>();

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
    // Basic rate limiting by IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [storedIp, data] of ipRequests.entries()) {
      if (now > data.resetTime) {
        ipRequests.delete(storedIp);
      }
    }
    
    // Check rate limit
    const ipData = ipRequests.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    if (ipData.count >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Too many attempts, please try again later' },
        { status: 429 }
      );
    }
    
    // Update rate limit counter
    ipRequests.set(ip, {
      count: ipData.count + 1,
      resetTime: ipData.resetTime
    });
    
    const { email, password } = await req.json();
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Initialize database and get user by email
    await initDb();
    
    let user = null;
    if (db.data) {
      user = db.data.users.find(u => u.email === email);
    }
    
    if (!user) {
      // Don't reveal that the email doesn't exist
      return NextResponse.json({ 
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify the password
    const isCorrect = await bcrypt.compare(password, user.password);

    // Set CORS headers
    const headers = new Headers();
    headers.append('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
    headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.append('Access-Control-Allow-Headers', 'Content-Type');

    if (isCorrect) {
      // If login successful, return user data (except password)
      const { password, ...userWithoutPassword } = user;
      
      return NextResponse.json({ 
        success: true,
        user: userWithoutPassword
      }, { headers });
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid email or password'
      }, { headers });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error verifying password:', err);
    return NextResponse.json(
      { error: 'Failed to verify password' }, // Don't expose specific error messages
      { status: 500 }
    );
  }
}