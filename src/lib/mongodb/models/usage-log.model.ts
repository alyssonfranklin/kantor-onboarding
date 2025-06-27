import mongoose, { Schema, Document } from 'mongoose';

export interface IUsageLog extends Document {
  usage_id: string;
  company_id: string;
  last_status_id: string;
  datetime: Date;
}

const UsageLogSchema: Schema = new Schema(
  {
    usage_id: { type: String, required: true, unique: true },
    company_id: { type: String, required: true },
    last_status_id: { type: String, required: true },
    datetime: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// Add index for efficient querying by company_id
UsageLogSchema.index({ company_id: 1, datetime: -1 });

// Export the model or create it if it doesn't exist
export default mongoose.models.UsageLog || mongoose.model<IUsageLog>('UsageLog', UsageLogSchema);