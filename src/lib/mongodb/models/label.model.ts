import mongoose, { Schema, Document } from 'mongoose';

export interface ILabel extends Document {
  key: string;      // Label key/identifier
  en: string;       // English translation
  pt: string;       // Portuguese translation
  es: string;       // Spanish translation
}

const LabelSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    en: { type: String, required: true },
    pt: { type: String, required: true },
    es: { type: String, required: true },
  },
  { timestamps: true }
);

// Index on key for faster lookups
LabelSchema.index({ key: 1 });

// Export the model or create it if it doesn't exist
export default mongoose.models.Label || mongoose.model<ILabel>('Label', LabelSchema);