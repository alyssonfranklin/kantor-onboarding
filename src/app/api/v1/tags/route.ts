import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import Tag from '@/lib/mongodb/models/tag.model';
import { v4 as uuidv4 } from 'uuid';

// GET /api/v1/tags - Get all tags for company or specific user
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, { userId, companyId }) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const targetUserId = searchParams.get('userId');

      let filter: any = { company_id: companyId };
      
      // If userId is provided, filter tags for that specific user
      if (targetUserId) {
        filter.user_id = targetUserId;
      }

      const tags = await Tag.find(filter)
        .sort({ created_at: -1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: tags
      });

    } catch (error) {
      console.error('Error fetching tags:', error);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// POST /api/v1/tags - Create a new tag
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, { userId, companyId }) => {
    try {
      await connectToDatabase();

      const body = await request.json();
      const { user_id, tag_name, tag_color } = body;

      // Validate required fields
      if (!user_id || !tag_name) {
        return NextResponse.json(
          { success: false, message: 'user_id and tag_name are required' },
          { status: 400 }
        );
      }

      // Check if tag already exists for this user
      const existingTag = await Tag.findOne({
        user_id,
        company_id: companyId,
        tag_name: tag_name.trim()
      });

      if (existingTag) {
        return NextResponse.json(
          { success: false, message: 'Tag already exists for this user' },
          { status: 409 }
        );
      }

      // Create new tag
      const newTag = new Tag({
        tag_id: uuidv4(),
        user_id,
        company_id: companyId,
        tag_name: tag_name.trim(),
        tag_color: tag_color || '#6B7280', // Default gray color
        created_by: userId
      });

      const savedTag = await newTag.save();

      return NextResponse.json({
        success: true,
        data: savedTag
      }, { status: 201 });

    } catch (error) {
      console.error('Error creating tag:', error);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}