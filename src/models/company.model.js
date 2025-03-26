/**
 * Company model schema definition
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CompanySchema = new Schema(
  {
    company_id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    assistant_id: { type: String, required: true },
    status: { 
      type: String, 
      required: true, 
      enum: ['active', 'inactive', 'pending'], 
      default: 'active' 
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Update the 'updated_at' field on save
CompanySchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Company', CompanySchema);