import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  employee_id: string;
  employee_name: string;
  employee_role: string;
  employee_leader: string;
  company_id: string;
}

const EmployeeSchema: Schema = new Schema(
  {
    employee_id: { type: String, required: true, unique: true },
    employee_name: { type: String, required: true },
    employee_role: { type: String, required: true },
    employee_leader: { type: String, required: true },
    company_id: { type: String, required: true },
  },
  { timestamps: true }
);

// Export the model or create it if it doesn't exist
export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);