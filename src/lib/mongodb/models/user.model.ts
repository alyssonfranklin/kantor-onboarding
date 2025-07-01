import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  id: string;
  email: string;
  name: string;
  company_id: string;
  role: string;
  created_at: Date;
  department: string;
  company_role: string;
  password: string;
  reports_to?: string; // ID of the user this person reports to
  insightsLeft?: number; // Number of insights credits remaining
  insightsDay?: number;  // The day of the month when insights reset
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    company_id: { type: String, required: true },
    role: { type: String, required: true, enum: ['user', 'orgadmin', 'admin'] },
    created_at: { type: Date, default: Date.now },
    department: { type: String, required: true },
    company_role: { type: String, required: true },
    password: { type: String, required: true },
    reports_to: { type: String, required: false }, // ID of the user this person reports to
    insightsLeft: { type: Number, default: 20 }, // Default number of insights credits
    insightsDay: { type: Number, default: 1 },   // Default day of month for reset
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    // Type assertion to ensure this.password is treated as a string
    const password = this.password as string;
    this.password = await bcrypt.hash(password, salt);
    next();
  } catch (error: unknown) {
    // Convert unknown error to Error object
    const err = error instanceof Error ? error : new Error(String(error));
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  // Type assertion to ensure this.password is treated as a string
  const password = this.password as string;
  return bcrypt.compare(candidatePassword, password);
};

// Export the model or create it if it doesn't exist
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);