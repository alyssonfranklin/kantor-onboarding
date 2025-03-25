import mongoose, { Schema, Document } from 'mongoose';

export interface IToken extends Document {
  token: string;
  user_id: string;
  expires_at: Date;
}

const TokenSchema: Schema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    expires_at: { type: Date, required: true },
  },
  { timestamps: true }
);

// Create index to automatically expire and remove tokens
TokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Export the model or create it if it doesn't exist
export default mongoose.models.Token || mongoose.model<IToken>('Token', TokenSchema);