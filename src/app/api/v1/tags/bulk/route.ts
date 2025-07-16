import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { dbConnect } from '@/lib/mongodb/connect';
import Tag from '@/lib/mongodb/models/tag.model';
import { v4 as uuidv4 } from 'uuid';

// POST /api/v1/tags/bulk - Create multiple tags or bulk assign tags to users
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, { userId, companyId }) => {
    try {
      await dbConnect();

      const body = await request.json();
      const { operation, data } = body;

      if (!operation || !data) {
        return NextResponse.json(
          { success: false, message: 'operation and data are required' },
          { status: 400 }
        );
      }

      let result;

      switch (operation) {
        case 'create_multiple':
          result = await createMultipleTags(data, companyId, userId);
          break;
        
        case 'assign_to_users':
          result = await assignTagsToUsers(data, companyId, userId);
          break;
        
        case 'remove_from_users':
          result = await removeTagsFromUsers(data, companyId);
          break;
        
        default:
          return NextResponse.json(
            { success: false, message: 'Invalid operation' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error in bulk tag operation:', error);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/v1/tags/bulk - Delete multiple tags
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req, { companyId }) => {
    try {
      await dbConnect();

      const body = await request.json();
      const { tag_ids } = body;

      if (!tag_ids || !Array.isArray(tag_ids)) {
        return NextResponse.json(
          { success: false, message: 'tag_ids array is required' },
          { status: 400 }
        );
      }

      const result = await Tag.deleteMany({
        tag_id: { $in: tag_ids },
        company_id: companyId
      });

      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} tags deleted successfully`,
        deletedCount: result.deletedCount
      });

    } catch (error) {
      console.error('Error in bulk tag deletion:', error);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// Helper function to create multiple tags
async function createMultipleTags(tags: any[], companyId: string, createdBy: string) {
  const tagsToCreate = tags.map(tag => ({
    tag_id: uuidv4(),
    user_id: tag.user_id,
    company_id: companyId,
    tag_name: tag.tag_name.trim(),
    tag_color: tag.tag_color || '#6B7280',
    created_by: createdBy
  }));

  // Check for duplicates
  const existingTags = await Tag.find({
    company_id: companyId,
    $or: tagsToCreate.map(tag => ({
      user_id: tag.user_id,
      tag_name: tag.tag_name
    }))
  });

  if (existingTags.length > 0) {
    throw new Error('Some tags already exist for the specified users');
  }

  const createdTags = await Tag.insertMany(tagsToCreate);
  return createdTags;
}

// Helper function to assign tags to multiple users
async function assignTagsToUsers(data: any, companyId: string, createdBy: string) {
  const { tag_names, user_ids, tag_color } = data;

  if (!tag_names || !user_ids || !Array.isArray(tag_names) || !Array.isArray(user_ids)) {
    throw new Error('tag_names and user_ids arrays are required');
  }

  const tagsToCreate = [];
  
  for (const userId of user_ids) {
    for (const tagName of tag_names) {
      tagsToCreate.push({
        tag_id: uuidv4(),
        user_id: userId,
        company_id: companyId,
        tag_name: tagName.trim(),
        tag_color: tag_color || '#6B7280',
        created_by: createdBy
      });
    }
  }

  // Remove duplicates that already exist
  const existingTags = await Tag.find({
    company_id: companyId,
    $or: tagsToCreate.map(tag => ({
      user_id: tag.user_id,
      tag_name: tag.tag_name
    }))
  });

  const existingTagKeys = new Set(
    existingTags.map(tag => `${tag.user_id}_${tag.tag_name}`)
  );

  const uniqueTagsToCreate = tagsToCreate.filter(
    tag => !existingTagKeys.has(`${tag.user_id}_${tag.tag_name}`)
  );

  if (uniqueTagsToCreate.length === 0) {
    throw new Error('All specified tags already exist for the users');
  }

  const createdTags = await Tag.insertMany(uniqueTagsToCreate);
  return {
    created: createdTags,
    skipped: tagsToCreate.length - uniqueTagsToCreate.length
  };
}

// Helper function to remove tags from multiple users
async function removeTagsFromUsers(data: any, companyId: string) {
  const { tag_names, user_ids } = data;

  if (!tag_names || !user_ids || !Array.isArray(tag_names) || !Array.isArray(user_ids)) {
    throw new Error('tag_names and user_ids arrays are required');
  }

  const result = await Tag.deleteMany({
    company_id: companyId,
    user_id: { $in: user_ids },
    tag_name: { $in: tag_names }
  });

  return {
    deletedCount: result.deletedCount
  };
}