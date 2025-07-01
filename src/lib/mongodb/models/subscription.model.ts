import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  subscription_id: string;
  company_id: string;
  user_id: string;
  kantor_version: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trial' | 'incomplete';
  current_period_start: Date;
  current_period_end: Date;
  trial_start?: Date;
  trial_end?: Date;
  billing_period: 'monthly' | 'annual';
  amount: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    subscription_id: { type: String, required: true, unique: true },
    company_id: { type: String, required: true },
    user_id: { type: String, required: true },
    kantor_version: { type: String, required: true },
    stripe_subscription_id: { type: String, required: false },
    stripe_customer_id: { type: String, required: false },
    status: { 
      type: String, 
      required: true, 
      enum: ['active', 'canceled', 'past_due', 'trial', 'incomplete'],
      default: 'trial'
    },
    current_period_start: { type: Date, required: true },
    current_period_end: { type: Date, required: true },
    trial_start: { type: Date, required: false },
    trial_end: { type: Date, required: false },
    billing_period: { type: String, required: true, enum: ['monthly', 'annual'] },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'USD' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Create indexes for efficient queries
SubscriptionSchema.index({ company_id: 1 });
SubscriptionSchema.index({ user_id: 1 });
SubscriptionSchema.index({ stripe_subscription_id: 1 });
SubscriptionSchema.index({ stripe_customer_id: 1 });

export default mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);