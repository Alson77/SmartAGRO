const mongoose = require('mongoose');

const expertMessageSchema = new mongoose.Schema(
  {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert', required: true },
    message: { type: String, required: true, trim: true },
    messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    attachments: [{ type: String }], // file URLs
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    status: { type: String, enum: ['sent', 'delivered', 'read', 'replied'], default: 'sent' },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    category: { type: String, enum: ['general', 'disease', 'pest', 'soil', 'irrigation', 'market'], default: 'general' },
    responseTime: { type: Number }, // in hours
    isExpertReply: { type: Boolean, default: false },
    parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpertMessage' }, // for threading
    tags: [{ type: String }], // for categorization
  },
  { timestamps: true }
);

// Index for better query performance
expertMessageSchema.index({ farmerId: 1, expertId: 1, createdAt: -1 });
expertMessageSchema.index({ expertId: 1, isRead: 1, createdAt: -1 });
expertMessageSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('ExpertMessage', expertMessageSchema);