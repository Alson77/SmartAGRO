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
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|tiff|tif/;
    const ext = path.extname(file.originalname || '').toLowerCase().replace('.', '');
    const mimePart = (file.mimetype || '').split('/').pop();
    const extOk = allowedTypes.test(ext);
    const mimeOk = allowedTypes.test(mimePart);
    if (extOk || mimeOk) {
      return cb(null, true);
    }
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

// Mock disease prediction (replace with actual AI model later)
router.post('/predict', jwtAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Mock prediction - in a real implementation, this would call your AI model
    const diseases = [
      'Tomato___healthy',
      'Tomato___Late_blight',
      'Tomato___Early_blight',
      'Potato___Early_blight',
      'Apple___Apple_scab'
    ];
    
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
    const confidence = Math.floor(Math.random() * 20) + 80; // 80-99%

    // Mock disease info (you can expand this)
    const diseaseInfo = {
      'Tomato___healthy': {
        description: 'टमाटर स्वस्थ छ, कुनै रोग छैन।',
        remedy: 'नियमित पानी र पोषणको सन्तुलन कायम राख्नुहोस्।'
      },
      'Tomato___Late_blight': {
        description: 'टमाटर लेट ब्लाइट Phytophthora infestans फफूंदीले हुने रोग हो। यसले पात र फलमा पानीले भिजेको जस्ता दागहरू बनाउँछ।',
        remedy: 'कपर बेस्ड फफूंदी नाशक प्रयोग गर्नुहोस्, र पानी जम्ने ठाउँहरूबाट टाढा राख्नुहोस्।'
      },
      'Tomato___Early_blight': {
        description: 'टमाटर अर्ली ब्लाइट Alternaria solani फफूंदीले हुने रोग हो। यसले पातको तल्लो भागमा वृत्ताकार दागहरू बनाउँछ।',
        remedy: 'फफूंदी नाशक स्प्रे गर्नुहोस् र झरेका पातहरू हटाउनुहोस्।'
      },
      'Potato___Early_blight': {
        description: 'आलु अर्ली ब्लाइट Alternaria solani फफूंदीले हुने रोग हो। यसले पातमा वृत्ताकार दागहरू बनाउँछ।',
        remedy: 'फफूंदी नाशक प्रयोग गर्नुहोस् र बाली चक्र अपनाउनुहोस्।'
      },
      'Apple___Apple_scab': {
        description: 'स्याउ स्क्याब Venturia inaequalis फफूंदीले हुने रोग हो। यसले पात, फल, र साना टहनीमा कालो र खुरदुरा दागहरू बनाउँछ।',
        remedy: 'रोग प्रतिरोधी स्याउ प्रजाति रोप्नुहोस्, कैप्टान वा म्यान्कोसेब जस्ता फफूंदी नाशक प्रयोग गर्नुहोस्।'
      }
    };

    const info = diseaseInfo[randomDisease] || {
      description: 'यस रोगको विस्तृत जानकारी उपलब्ध छैन।',
      remedy: 'कृषि विज्ञसँग परामर्श गर्नुहोस्।'
    };

    res.json({
      label: randomDisease,
      confidence: confidence,
      description: info.description,
      remedy: info.remedy
    });

  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ message: 'Failed to process image' });
  }
});

module.exports = router;