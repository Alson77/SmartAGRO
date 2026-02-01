const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true,
    index: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
chatMessageSchema.index({ farmer: 1, session: 1, timestamp: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);