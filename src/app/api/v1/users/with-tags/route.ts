import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import Tag from '@/lib/mongodb/models/tag.model';

// GET /api/v1/users/with-tags - Get all users with their associated tags
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      await dbConnect();

      // Access control - regular users can only see users from their company
      let userQuery = {};
      let tagQuery = {};
      if (user.role !== 'admin') {
        userQuery = { company_id: user.company_id };
        tagQuery = { company_id: user.company_id };
      }

      // Get all users (all companies if admin, or just user's company if not admin)
      const users = await User.find(userQuery)
        .select('-password') // Exclude password field
        .sort({ name: 1 })
        .lean();

      // Get all tags for users (all companies if admin, or just user's company if not admin)
      const tags = await Tag.find(tagQuery)
        .sort({ tag_name: 1 })
        .lean();

      // Group tags by user_id
      const tagsByUser = tags.reduce((acc: any, tag) => {
        if (!acc[tag.user_id]) {
          acc[tag.user_id] = [];
        }
        acc[tag.user_id].push({
          tag_id: tag.tag_id,
          tag_name: tag.tag_name,
          tag_color: tag.tag_color,
          created_at: tag.created_at
        });
        return acc;
      }, {});

      // Combine users with their tags
      const usersWithTags = users.map(user => ({
        ...user,
        tags: tagsByUser[user.id] || []
      }));

      return NextResponse.json({
        success: true,
        data: usersWithTags
      });

    } catch (error) {
      console.error('Error fetching users with tags:', error);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}