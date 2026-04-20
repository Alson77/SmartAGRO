const mongoose = require('mongoose');

const ExpertBookingSchema = new mongoose.Schema(
  {
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expert',
      required: true
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true
    },
    farmerName: {
      type: String,
      required: true
    },
    farmerEmail: {
      type: String,
      required: true
    },
    expertName: {
      type: String,
      required: true
    },
    expertise: {
      type: String,
      required: true
    },
    consultationFee: {
      type: Number,
      required: true
    },
    scheduledDate: {
      type: Date,
      required: true
    },
    scheduledTime: {
      type: String,
      required: true
    },
    topic: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    paymentTransactionId: {
      type: String
    },
    paymentMethod: {
      type: String,
      enum: ['esewa', 'bank_transfer', 'card', 'wallet', 'other'],
      default: 'esewa'
    },
    selectedBank: {
      type: String,
      // For bank_transfer method: 'Nepal Bank Limited', 'Rastriya Banijya Bank', etc.
    },
    paymentReference: {
      type: String
    },
    paymentDate: {
      type: Date
    },
    consultationLink: {
      type: String,
      // Video call or meeting link
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying
ExpertBookingSchema.index({ expertId: 1, scheduledDate: 1 });
ExpertBookingSchema.index({ farmerId: 1, scheduledDate: -1 });
ExpertBookingSchema.index({ status: 1 });
ExpertBookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ExpertBooking', ExpertBookingSchema);