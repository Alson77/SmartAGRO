const mongoose = require('mongoose');
const FarmerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  // Fields to support password reset via OTP
  resetOTP: { type: String, default: null },
  resetOTPExpiry: { type: Date, default: null },
  location: String,
  phone: String,
  farmerType: String,
  farmSize: String,
  gender: String,
  dob: String,
  profilePic: { type: String, default: '' }, // image URL or path
  termsAgreed: { type: Boolean, default: false }, // from agree checkbox
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null }
});
module.exports = mongoose.model('Farmer', FarmerSchema);