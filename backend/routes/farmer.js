const express = require('express');
const Farmer = require('../models/Farmer');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwtAuth = require('../middleware/jwtAuth');

// Multer setup for profilePic uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// GET /api/farmer/:id - fetch farmer profile
router.get('/:id', async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id).lean();
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    // Always return all fields, fallback to empty string if missing
    res.json({
      id: farmer._id,
      name: farmer.name || '',
      email: farmer.email || '',
      location: farmer.location || '',
      phone: farmer.phone || '',
      farmerType: farmer.farmerType || '',
      farmSize: farmer.farmSize || '',
      gender: farmer.gender || '',
      dob: farmer.dob || '',
      profilePic: farmer.profilePic || '',
      termsAgreed: farmer.termsAgreed || false,
      createdAt: farmer.createdAt || ''
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
});

// PUT /api/farmer/:id - update farmer profile
router.put('/:id', upload.single('profilePic'), async (req, res) => {
  try {
    const updateFields = { ...req.body };
    if (req.file) {
      updateFields.profilePic = '/uploads/' + req.file.filename;
    }
    // Remove passwordHash and email from updateFields if present
    delete updateFields.passwordHash;
    delete updateFields.email;
    const farmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).lean();
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    res.json(farmer);
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
});

module.exports = router;

// POST /api/farmer/change-password - change farmer password
router.post('/change-password', jwtAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required' });
    }
    // Get farmer id from JWT
    const farmerId = req.user.id;
    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, farmer.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);
    farmer.passwordHash = newHash;
    await farmer.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error changing password', error: err.message });
  }
});