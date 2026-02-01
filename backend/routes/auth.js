const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Farmer = require('../models/Farmer');
const multer = require('multer');
const path = require('path');
const router = express.Router();

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

// Check if email already exists
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const existing = await Farmer.findOne({ email });
    res.json({ exists: !!existing });
  } catch (err) {
    res.status(500).json({ message: 'Error checking email', error: err.message });
  }
});

// Registration (with file upload)
router.post('/register', upload.single('profilePic'), async (req, res) => {
  try {
    const {
      name, email, password, phone, location, farmerType, farmSize, gender, dob, termsAgreed
    } = req.body;
    const existing = await Farmer.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    let profilePic = '';
    if (req.file) {
      profilePic = '/uploads/' + req.file.filename;
    }
    const farmer = new Farmer({
      name,
      email,
      passwordHash,
      phone,
      location,
      farmerType,
      farmSize,
      gender,
      dob,
      profilePic,
      termsAgreed: termsAgreed === 'true' || termsAgreed === true
    });
    await farmer.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const farmer = await Farmer.findOne({ email });
    if (!farmer) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, farmer.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    // Update last login time
    farmer.lastLogin = new Date();
    await farmer.save();
    
    const token = jwt.sign({ id: farmer._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      farmer: {
        id: farmer._id,
        name: farmer.name,
        email: farmer.email,
        location: farmer.location,
        phone: farmer.phone,
        farmerType: farmer.farmerType,
        farmSize: farmer.farmSize,
        gender: farmer.gender,
        dob: farmer.dob,
        profilePic: farmer.profilePic,
        termsAgreed: farmer.termsAgreed,
        createdAt: farmer.createdAt,
        lastLogin: farmer.lastLogin
      }
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});


module.exports = router;