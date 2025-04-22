import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import Company from '@/lib/mongodb/models/company.model';
import Department from '@/lib/mongodb/models/department.model';
import Employee from '@/lib/mongodb/models/employee.model';

/**
 * Test route that also provides API connection details for Google Apps Script integration
 */
export async function GET() {
  try {
    // Get the MongoDB URI from environment variable
    const MONGODB_URI = process.env.MONGODB_URI || '';
    
    if (!MONGODB_URI) {
      return NextResponse.json({ 
        success: false, 
        message: 'MONGODB_URI environment variable is not set',
        env: process.env.NODE_ENV
      });
    }
    
    // Print the URI but mask the password for security
    const uriParts = MONGODB_URI.split('@');
    let maskedUri = MONGODB_URI;
    
    if (uriParts.length > 1) {
      const authPart = uriParts[0].split(':');
      if (authPart.length > 1) {
        maskedUri = `${authPart[0]}:***********@${uriParts.slice(1).join('@')}`;
      }
    }
    
    // Attempt to connect to MongoDB
    console.log('Testing MongoDB connection to:', maskedUri);
    
    try {
      await dbConnect();
      
      // Get connection stats
      const stats = {
        connected: mongoose.connection.readyState === 1,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        // Count of collections to verify we can query the database
        collections: Object.keys(mongoose.connection.collections).length
      };
      
      // Get API endpoints info for Google Apps Script
      const apiInfo = {
        baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        endpoints: {
          users: '/api/users',
          companies: '/api/companies',
          departments: '/api/departments',
          employees: '/api/employees',
          verifyPassword: '/api/verify-password',
          adminVerifyPassword: '/api/admin/verify-password',
        },
        auth: 'Bearer JWT token required in Authorization header',
        documentation: 'See below for required fields and response formats'
      };
      
      // Get schema info for Google Apps Script
      const schemaInfo = {
        user: {
          fields: ['id', 'email', 'name', 'company_id', 'role', 'department', 'company_role'],
          required: ['email', 'name', 'password', 'company_id']
        },
        company: {
          fields: ['company_id', 'name', 'assistant_id', 'status', 'created_at', 'updated_at'],
          required: ['name', 'assistant_id']
        },
        department: {
          fields: ['company_id', 'department_name', 'department_desc', 'user_head'],
          required: ['company_id', 'department_name']
        },
        employee: {
          fields: ['employee_id', 'employee_name', 'employee_role', 'company_id'],
          required: ['employee_name', 'company_id']
        }
      };
      
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to MongoDB',
        uri: maskedUri,
        connection: stats,
        collections: Object.keys(mongoose.connection.collections),
        api: apiInfo,
        schemas: schemaInfo,
        googleAppsScriptGuide: "Use UrlFetchApp in Google Apps Script to make API calls to these endpoints"
      });
    } catch (connError) {
      console.error('Failed to connect to MongoDB:', connError);
      
      return NextResponse.json({
        success: false,
        message: 'Failed to connect to MongoDB',
        error: connError instanceof Error ? connError.message : String(connError),
        uri: maskedUri,
      });
    }
  } catch (error) {
    console.error('Error in test route:', error);
    
    return NextResponse.json({
      success: false,
      message: 'An error occurred while testing MongoDB connection',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}