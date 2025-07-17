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

      // Get search params
      const url = new URL(request.url);
      const companyId = url.searchParams.get('companyId');
      const limit = parseInt(url.searchParams.get('limit') || '100', 10);
      const skip = parseInt(url.searchParams.get('skip') || '0', 10);

      // Access control - regular users can only see users from their company
      let userQuery = {};
      let tagQuery = {};
      if (user.role !== 'admin') {
        userQuery = { company_id: user.company_id };
        tagQuery = { company_id: user.company_id };
      }

      // Add company filter if provided (admin only or user's own company)
      if (companyId && (user.role === 'admin' || companyId === user.company_id)) {
        userQuery = { ...userQuery, company_id: companyId };
        tagQuery = { ...tagQuery, company_id: companyId };
      }

      // Get all users (all companies if admin, or just user's company if not admin)
      const users = await User.find(userQuery)
        .select('-password') // Exclude password field
        .sort({ name: 1 })
        .limit(limit)
        .skip(skip)
        .lean();

      // Get total count for pagination
      const total = await User.countDocuments(userQuery);

      // Get user IDs from the filtered users
      const userIds = users.map(user => user.id);

      // Get tags for those specific users AND the company
      let tagQuery2 = {};
      if (user.role !== 'admin') {
        tagQuery2 = { 
          company_id: user.company_id,
          user_id: { $in: userIds }
        };
      } else {
        tagQuery2 = { user_id: { $in: userIds } };
      }

      // Add company filter if provided (admin only or user's own company)
      if (companyId && (user.role === 'admin' || companyId === user.company_id)) {
        tagQuery2 = { 
          company_id: companyId,
          user_id: { $in: userIds }
        };
      }

      const tags = await Tag.find(tagQuery2)
        .sort({ Tag: 1 })
        .lean();

      console.log('API Debug - Found tags:', tags.length);
      if (tags.length > 0) {
        console.log('API Debug - First tag:', JSON.stringify(tags[0], null, 2));
      }

      // Group tags by user_id
      const tagsByUser = tags.reduce((acc: any, tag) => {
        if (!acc[tag.user_id]) {
          acc[tag.user_id] = [];
        }
        acc[tag.user_id].push({
          tag_id: tag._id || tag.tag_id,
          tag_name: tag.Tag,
          created_at: tag.createdAt
        });
        return acc;
      }, {});

      // Combine users with their tags
      const usersWithTags = users.map(user => {
        const userTags = tagsByUser[user.id] || [];
        return {
          ...user,
          tags: userTags
        };
      });

      console.log('API Debug - Users with tags count:', usersWithTags.length);
      if (usersWithTags.length > 0) {
        const userWithTags = usersWithTags.find(u => u.tags && u.tags.length > 0);
        if (userWithTags) {
          console.log('API Debug - User with tags example:', JSON.stringify({
            id: userWithTags.id,
            email: userWithTags.email,
            tags: userWithTags.tags
          }, null, 2));
        }
      }

      return NextResponse.json({
        success: true,
        data: usersWithTags,
        meta: {
          total,
          limit,
          skip
        }
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