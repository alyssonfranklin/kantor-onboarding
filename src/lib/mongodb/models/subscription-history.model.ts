import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionHistory extends Document {
  history_id: string;
  user_id: string;
  company_id: string;
  subscription_id?: string;
  stripe_subscription_id?: string;
  action: 'created' | 'updated' | 'canceled' | 'paused' | 'resumed' | 'trial_started' | 'trial_ended' | 'payment_succeeded' | 'payment_failed';
  previous_status?: string;
  new_status?: string;
  previous_plan?: string;
  new_plan?: string;
  amount?: number;
  currency?: string;
  billing_period?: 'monthly' | 'annual';
  metadata?: any; // Additional data about the change
  stripe_event_id?: string; // For webhook deduplication
  created_at: Date;
  created_by?: string; // User who initiated the change (for manual actions)
}

const SubscriptionHistorySchema: Schema = new Schema(
  {
    history_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    company_id: { type: String, required: true },
    subscription_id: { type: String, required: false },
    stripe_subscription_id: { type: String, required: false },
    action: { 
      type: String, 
      required: true,
      enum: [
        'created', 'updated', 'canceled', 'paused', 'resumed',
        'trial_started', 'trial_ended', 'payment_succeeded', 'payment_failed'
      ]
    },
    previous_status: { type: String, required: false },
    new_status: { type: String, required: false },
    previous_plan: { type: String, required: false },
    new_plan: { type: String, required: false },
    amount: { type: Number, required: false },
    currency: { type: String, required: false, default: 'USD' },
    billing_period: { 
      type: String, 
      required: false,
      enum: ['monthly', 'annual']
    },
    metadata: { type: Schema.Types.Mixed, required: false },
    stripe_event_id: { type: String, required: false },
    created_at: { type: Date, default: Date.now },
    created_by: { type: String, required: false }
  },
  { timestamps: true }
);

// Create indexes for efficient queries
SubscriptionHistorySchema.index({ user_id: 1, created_at: -1 });
SubscriptionHistorySchema.index({ company_id: 1, created_at: -1 });
SubscriptionHistorySchema.index({ subscription_id: 1, created_at: -1 });
SubscriptionHistorySchema.index({ stripe_subscription_id: 1 });
SubscriptionHistorySchema.index({ stripe_event_id: 1 });

export default mongoose.models.SubscriptionHistory || mongoose.model<ISubscriptionHistory>('SubscriptionHistory', SubscriptionHistorySchema);