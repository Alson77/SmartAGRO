const mongoose = require('mongoose');

const ScrapedSubsidySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  subsidyType: { type: String, required: true },
  eligibleCrops: [{ type: String }],
  eligibleFarmers: { type: String },
  applicationDeadline: { type: Date },
  maximumAmount: { type: Number },
  minimumFarmSize: { type: Number },
  requirements: [{ type: String }],
  applicationProcess: { type: String },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  sourceUrl: { type: String, required: true },
  sourceName: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  region: { type: String, default: 'Nepal' },
  category: { type: String, enum: ['agricultural', 'equipment', 'seeds', 'fertilizer', 'irrigation', 'other'], default: 'agricultural' }
});

module.exports = mongoose.model('ScrapedSubsidy', ScrapedSubsidySchema);