const mongoose = require('mongoose');

const expertSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    crops: { type: [String], default: [] },
    specialization: { type: [String], default: [] },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    whatsapp: { type: String, trim: true },
    isOnline: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    district: { type: String, default: '' },
    bio: { type: String, default: '' },
    experience: { type: Number, default: 0 }, // years of experience
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    languages: { type: [String], default: ['Nepali', 'English'] },
    certifications: { type: [String], default: [] },
    profileImage: { type: String, default: '' },
    lastActivity: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    consultationFee: { type: Number, default: 0 }, // in NPR
    responseTime: { type: Number, default: 24 }, // average response time in hours
    totalConsultations: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Index for better search performance
expertSchema.index({ name: 'text', role: 'text', bio: 'text', crops: 'text' });
expertSchema.index({ district: 1, isOnline: -1 });
expertSchema.index({ rating: -1, isOnline: -1 });

module.exports = mongoose.model('Expert', expertSchema);