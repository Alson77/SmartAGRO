const mongoose = require('mongoose');

const diseaseDetectionSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  disease: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  severity: {
    type: String,
    enum: ['Healthy', 'None', 'Mild', 'Moderate', 'Severe'],
    required: true
  },
  treatment: {
    type: String,
    required: true
  },
  prevention: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },
  scannedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DiseaseDetection', diseaseDetectionSchema);