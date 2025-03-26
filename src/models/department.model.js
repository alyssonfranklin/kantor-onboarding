/**
 * Department model schema definition
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DepartmentSchema = new Schema(
  {
    company_id: { type: String, required: true },
    department_name: { type: String, required: true },
    department_desc: { type: String, required: true },
    user_head: { type: String, required: true },
  },
  { timestamps: true }
);

// Add a compound index to ensure uniqueness of department name within a company
DepartmentSchema.index({ company_id: 1, department_name: 1 }, { unique: true });

module.exports = mongoose.model('Department', DepartmentSchema);