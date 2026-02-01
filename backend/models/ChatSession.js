const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [{
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
  }],
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
chatSessionSchema.index({ farmer: 1, lastMessageAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);