import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import { withAuth } from '@/lib/middleware/auth';
import { generateId } from '@/lib/mongodb/utils/id-generator';

/**
 * Get all users (with optional filtering)
 * GET /api/users
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    console.log('GET /api/users - Handler started with user:', {
      id: user.id, 
      role: user.role, 
      companyId: user.company_id
    });
    
    try {
      await dbConnect();
      console.log('GET /api/users - Connected to MongoDB');
      
      // Access control - regular users can only see users from their company
      let query = {};
      if (user.role !== 'admin') {
        query = { company_id: user.company_id };
      }
      
      // Get search params
      const url = new URL(req.url);
      const companyId = url.searchParams.get('companyId');
      const role = url.searchParams.get('role');
      const limit = parseInt(url.searchParams.get('limit') || '100', 10);
      const skip = parseInt(url.searchParams.get('skip') || '0', 10);
      
      console.log('GET /api/users - Query parameters:', { companyId, role, limit, skip });
      
      // Add filters if provided
      if (companyId && (user.role === 'admin' || companyId === user.company_id)) {
        query = { ...query, company_id: companyId };
      }
      
      if (role) {
        query = { ...query, role };
      }
      
      console.log('GET /api/users - Final query:', query);
      
      // Query database with pagination
      const users = await User.find(query)
        .select('-password')
        .limit(limit)
        .skip(skip)
        .sort({ created_at: -1 });
      
      const total = await User.countDocuments(query);
      
      console.log(`GET /api/users - Found ${users.length} users out of ${total} total`);
      
      // For debugging, log the user IDs
      if (users.length > 0) {
        console.log('User IDs found:', users.map(u => u.id));
      } else {
        console.log('No users found for query');
      }
      
      return NextResponse.json({
        success: true,
        data: users,
        meta: {
          total,
          limit,
          skip
        }
      });
    } catch (error) {
      console.error('Error getting users:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to get users',
          error: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  });
}

/**
 * Create a new user
 * POST /api/users
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (req, authUser) => {
    await dbConnect();
    
    try {
      const body = await req.json();
      
      // Validate required fields
      if (!body.email || !body.name || !body.company_id || !body.password) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: body.email });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Email already exists' },
          { status: 409 }
        );
      }
      
      // Access control - only admins can create users for other companies
      if (body.company_id !== authUser.company_id && authUser.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to create user for this company' },
          { status: 403 }
        );
      }
      
      // Generate user ID
      const userId = await generateId('USER');
      
      // Create user
      const user = await User.create({
        id: userId,
        email: body.email,
        name: body.name,
        company_id: body.company_id,
        password: body.password,
        role: body.role || 'user',
        department: body.department || 'General',
        company_role: body.company_role || 'employee',
        created_at: new Date()
      });
      
      // Return user data without password
      const userData = user.toObject();
      delete userData.password;
      
      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        data: userData
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create user' },
        { status: 500 }
      );
    }
  });
}