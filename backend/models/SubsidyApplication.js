const mongoose = require('mongoose');

const SubsidyApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  subsidyType: { type: String, required: true },
  cropType: { type: String, required: true },
  farmArea: { type: Number, required: true },
  expectedAmount: { type: Number, required: true },
  purpose: { type: String, required: true },
  description: { type: String, required: true },
  contactNumber: { type: String, required: true },
  citizenshipFront: { type: String },
  citizenshipBack: { type: String },
  nidFront: { type: String },
  nidBack: { type: String },
  landOwnership: { type: String },
  farmerReg: { type: String },
  other: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  appliedDate: { type: Date, default: Date.now },
  adminReplies: { type: [String], default: [] }
});

module.exports = mongoose.model('SubsidyApplication', SubsidyApplicationSchema);