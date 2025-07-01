import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  payment_id: string;
  subscription_id: string;
  company_id: string;
  user_id: string;
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled';
  payment_method: 'card' | 'paypal' | 'pix' | 'other';
  description: string;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    payment_id: { type: String, required: true, unique: true },
    subscription_id: { type: String, required: true },
    company_id: { type: String, required: true },
    user_id: { type: String, required: true },
    stripe_payment_intent_id: { type: String, required: false },
    stripe_invoice_id: { type: String, required: false },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'USD' },
    status: { 
      type: String, 
      required: true, 
      enum: ['succeeded', 'pending', 'failed', 'canceled'],
      default: 'pending'
    },
    payment_method: { 
      type: String, 
      required: true, 
      enum: ['card', 'paypal', 'pix', 'other'],
      default: 'card'
    },
    description: { type: String, required: true },
    paid_at: { type: Date, required: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Create indexes for efficient queries
PaymentSchema.index({ subscription_id: 1 });
PaymentSchema.index({ company_id: 1 });
PaymentSchema.index({ user_id: 1 });
PaymentSchema.index({ stripe_payment_intent_id: 1 });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);