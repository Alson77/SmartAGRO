const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DiseaseDetection = require('../models/DiseaseDetection');
const jwtAuth = require('../middleware/jwtAuth');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/disease-images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'disease-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common image extensions and mimetypes (include webp, bmp, tiff)
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|tiff|tif/;
    const ext = path.extname(file.originalname || '').toLowerCase().replace('.', '');
    const mimePart = (file.mimetype || '').split('/').pop();

    const extOk = allowedTypes.test(ext);
    const mimeOk = allowedTypes.test(mimePart);

    // Accept if either extension OR mimetype indicates an image (more permissive)
    if (extOk || mimeOk) {
      return cb(null, true);
    }

    // Reject non-image files
    cb(new Error('Only image files are allowed!'));
  }
});

// Save disease detection result with image
router.post('/save', jwtAuth, upload.single('image'), async (req, res) => {
  try {
    // Ensure JWT middleware provided user info
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: missing user information' });
    }

    const { disease, confidence, severity, treatment, prevention } = req.body || {};
    
    // Get image path if uploaded
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/disease-images/${req.file.filename}`;
    }
    // Basic validation and sanitization
    if (!disease) return res.status(400).json({ message: 'Missing disease name' });
    const confNum = parseFloat(confidence);
    const confVal = Number.isFinite(confNum) ? confNum : 0;
    const sev = severity || 'None';
    const treat = treatment || 'Not specified';
    const prevent = prevention || 'Not specified';
    
    const detection = new DiseaseDetection({
      farmer: req.user.id,
      disease,
      confidence: confVal,
      severity: sev,
      treatment: treat,
      prevention: prevent,
      imageUrl
    });

    await detection.save();
    
    res.status(201).json({
      message: 'Detection saved successfully',
      detection
    });
  } catch (error) {
    console.error('Save detection error:', error);
    res.status(500).json({ message: 'Failed to save detection result' });
  }
});

// Get recent scans for logged-in farmer
router.get('/recent', jwtAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const detections = await DiseaseDetection.find({ farmer: req.user.id })
      .sort({ scannedAt: -1 })
      .limit(limit)
      .select('-__v');
    
    res.json(detections);
  } catch (error) {
    console.error('Get recent scans error:', error);
    res.status(500).json({ message: 'Failed to retrieve recent scans' });
  }
});

// Get detection by ID
router.get('/:id', jwtAuth, async (req, res) => {
  try {
    const detection = await DiseaseDetection.findOne({
      _id: req.params.id,
      farmer: req.user.id
    });
    
    if (!detection) {
      return res.status(404).json({ message: 'Detection not found' });
    }
    
    res.json(detection);
  } catch (error) {
    console.error('Get detection error:', error);
    res.status(500).json({ message: 'Failed to retrieve detection' });
  }
});

// Delete detection
router.delete('/:id', jwtAuth, async (req, res) => {
  try {
    const detection = await DiseaseDetection.findOneAndDelete({
      _id: req.params.id,
      farmer: req.user.id
    });
    
    if (!detection) {
      return res.status(404).json({ message: 'Detection not found' });
    }
    
    res.json({ message: 'Detection deleted successfully' });
  } catch (error) {
    console.error('Delete detection error:', error);
    res.status(500).json({ message: 'Failed to delete detection' });
  }
});

module.exports = router;