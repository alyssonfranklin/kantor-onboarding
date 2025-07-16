import mongoose, { Schema, Document } from 'mongoose';

export interface ITag extends Document {
  tag_id: string;
  user_id: string;
  company_id: string;
  tag_name: string;
  tag_color?: string;
  created_at: Date;
  created_by: string;
}

const TagSchema: Schema = new Schema(
  {
    tag_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    company_id: { type: String, required: true },
    tag_name: { type: String, required: true },
    tag_color: { type: String, required: false }, // Optional color for tag display
    created_at: { type: Date, default: Date.now },
    created_by: { type: String, required: true }, // ID of user who created the tag
  },
  { timestamps: true }
);

// Create compound index for efficient queries
TagSchema.index({ user_id: 1, company_id: 1 });
TagSchema.index({ company_id: 1, tag_name: 1 });

// Export the model or create it if it doesn't exist
export default mongoose.models.Tag || mongoose.model<ITag>('Tag', TagSchema);