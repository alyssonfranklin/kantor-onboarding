import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { dbConnect } from '@/lib/mongodb/connect';
import Tag from '@/lib/mongodb/models/tag.model';

// GET /api/v1/tags/[id] - Get specific tag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, { companyId }) => {
    try {
      await dbConnect();
      const { id } = await params;

      const tag = await Tag.findOne({
        tag_id: id,
        company_id: companyId
      }).lean();

      if (!tag) {
        return NextResponse.json(
          { success: false, message: 'Tag not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: tag
      });

    } catch (error) {
      console.error('Error fetching tag:', error);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/v1/tags/[id] - Update tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, { companyId }) => {
    try {
      await dbConnect();
      const { id } = await params;

      const body = await request.json();
      const { tag_name, tag_color } = body;

      // Validate required fields
      if (!tag_name) {
        return NextResponse.json(
          { success: false, message: 'tag_name is required' },
          { status: 400 }
        );
      }

      // Check if tag exists and belongs to the company
      const existingTag = await Tag.findOne({
        tag_id: id,
        company_id: companyId
      });

      if (!existingTag) {
        return NextResponse.json(
          { success: false, message: 'Tag not found' },
          { status: 404 }
        );
      }

      // Check if new tag name already exists for this user (excluding current tag)
      const duplicateTag = await Tag.findOne({
        user_id: existingTag.user_id,
        company_id: companyId,
        tag_name: tag_name.trim(),
        tag_id: { $ne: id }
      });

      if (duplicateTag) {
        return NextResponse.json(
          { success: false, message: 'Tag name already exists for this user' },
          { status: 409 }
        );
      }

      // Update tag
      const updatedTag = await Tag.findOneAndUpdate(
        { tag_id: id, company_id: companyId },
        {
          tag_name: tag_name.trim(),
          tag_color: tag_color || existingTag.tag_color
        },
        { new: true, lean: true }
      );

      return NextResponse.json({
        success: true,
        data: updatedTag
      });

    } catch (error) {
      console.error('Error updating tag:', error);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/v1/tags/[id] - Delete tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, { companyId }) => {
    try {
      await dbConnect();
      const { id } = await params;

      // Check if tag exists and belongs to the company
      const existingTag = await Tag.findOne({
        tag_id: id,
        company_id: companyId
      });

      if (!existingTag) {
        return NextResponse.json(
          { success: false, message: 'Tag not found' },
          { status: 404 }
        );
      }

      // Delete the tag
      await Tag.deleteOne({
        tag_id: id,
        company_id: companyId
      });

      return NextResponse.json({
        success: true,
        message: 'Tag deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting tag:', error);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}