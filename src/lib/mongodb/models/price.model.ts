import mongoose, { Schema, Document } from 'mongoose';

export interface IPrice extends Document {
  price_id: string;
  kantor_version: string;
  price_value: number;
  currency_id: string;
  billing_period: 'monthly' | 'annual';
  stripe_price_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const PriceSchema: Schema = new Schema(
  {
    price_id: { type: String, required: true, unique: true },
    kantor_version: { type: String, required: true },
    price_value: { type: Number, required: true },
    currency_id: { type: String, required: true, default: 'USD' },
    billing_period: { type: String, required: true, enum: ['monthly', 'annual'] },
    stripe_price_id: { type: String, required: false }, // Stripe Price ID for API calls
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Create indexes for efficient queries
PriceSchema.index({ kantor_version: 1, billing_period: 1 });
PriceSchema.index({ stripe_price_id: 1 });

export default mongoose.models.Price || mongoose.model<IPrice>('Price', PriceSchema);