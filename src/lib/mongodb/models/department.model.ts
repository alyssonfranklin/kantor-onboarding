import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  department_id: string;
  company_id: string;
  department_name: string;
  department_lead?: string;
}

const DepartmentSchema: Schema = new Schema(
  {
    department_id: { type: String, required: true, unique: true },
    company_id: { type: String, required: true },
    department_name: { type: String, required: true },
    department_lead: { type: String, required: false },
  },
  { timestamps: true }
);

// Add a compound index to ensure uniqueness of department name within a company
DepartmentSchema.index({ company_id: 1, department_name: 1 }, { unique: true });

// Export the model or create it if it doesn't exist
export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);