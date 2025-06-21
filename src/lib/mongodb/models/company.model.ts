import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  company_id: string;
  name: string;
  assistant_id: string;
  company_subscription?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

const CompanySchema: Schema = new Schema(
  {
    company_id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    assistant_id: { type: String, required: true },
    company_subscription: { type: String, trim: true },
    status: { type: String, required: true, enum: ['active', 'inactive', 'pending'], default: 'active' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Update the 'updated_at' field on save
CompanySchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Export the model or create it if it doesn't exist
export default mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);