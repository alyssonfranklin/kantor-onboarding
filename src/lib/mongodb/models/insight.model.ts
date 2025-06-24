// src/lib/mongodb/models/insight.model.ts
import { Document, Schema, model, models } from 'mongoose';

export interface IInsight extends Document {
  insight_id: string;
  kantor_version: string;
  insights_limit: number;
  insights_day?: number;
  price_monthly?: number;
  description?: string;
  features?: string[];
  created_at: Date;
  updated_at: Date;
}

const InsightSchema: Schema = new Schema({
  insight_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  kantor_version: {
    type: String,
    required: true,
    trim: true
  },
  insights_limit: {
    type: Number,
    required: true,
    default: 20
  },
  insights_day: {
    type: Number,
    default: 1
  },
  price_monthly: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  features: [{
    type: String,
    trim: true
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Create indexes for better performance
// Note: insight_id already has unique index from schema definition
InsightSchema.index({ kantor_version: 1 });

const Insight = models.Insight || model<IInsight>('Insight', InsightSchema);

export default Insight;