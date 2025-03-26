/**
 * Token model schema definition
 * Used for storing and tracking JWT tokens
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    expires_at: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
    revoked_at: { type: Date },
  },
  { timestamps: true }
);

// Create index to automatically expire and remove tokens
TokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Token', TokenSchema);