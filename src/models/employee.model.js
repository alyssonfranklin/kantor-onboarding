/**
 * Employee model schema definition
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmployeeSchema = new Schema(
  {
    employee_id: { type: String, required: true, unique: true },
    employee_name: { type: String, required: true },
    employee_role: { type: String, required: true },
    employee_leader: { type: String, required: true },
    company_id: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', EmployeeSchema);