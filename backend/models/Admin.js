const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: '' }, // profile image URL
  phone: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  permissions: { type: [String], default: ['all'] },
  lastLogin: { type: Date },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admin', AdminSchema);