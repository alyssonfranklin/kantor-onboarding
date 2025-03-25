import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  company_id: string;
  department_name: string;
  department_desc: string;
  user_head: string;
}

const DepartmentSchema: Schema = new Schema(
  {
    company_id: { type: String, required: true },
    department_name: { type: String, required: true },
    department_desc: { type: String, required: true },
    user_head: { type: String, required: true },
  },
  { timestamps: true }
);

// Add a compound index to ensure uniqueness of department name within a company
DepartmentSchema.index({ company_id: 1, department_name: 1 }, { unique: true });

// Export the model or create it if it doesn't exist
export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);