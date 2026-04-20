const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SubsidyApplication = require('../models/SubsidyApplication');
const OngoingSubsidy = require('../models/OngoingSubsidy');
const ScrapedSubsidy = require('../models/ScrapedSubsidy');
const subsidyScraper = require('../services/subsidyScraper');

// GET /api/subsidy/documents/:id
router.get('/documents/:id', async (req, res) => {
  try {
    const app = await SubsidyApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    // Build URLs for each document field
    const docFields = [
      'citizenshipFront', 'citizenshipBack', 'nidFront', 'nidBack',
      'landOwnership', 'farmerReg', 'other'
    ];
    const documents = {};
    docFields.forEach(field => {
      if (app[field]) {
        documents[field] = `/uploads/subsidy/${app[field]}`;
      }
    });
    res.json({ success: true, documents });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Admin: Get all subsidy applications
router.get('/all', async (req, res) => {
  try {
    // Directly fetch from the 'subsidyapplications' collection
    const applications = await SubsidyApplication.find()
      .sort({ appliedDate: -1 })
      .populate({ path: 'user', select: 'name email', strictPopulate: false });
    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Storage config for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/subsidy');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

const jwtAuth = require('../middleware/jwtAuth');

// POST /api/subsidy/apply
router.post('/apply', jwtAuth, upload.fields([
  { name: 'citizenshipFront', maxCount: 1 },
  { name: 'citizenshipBack', maxCount: 1 },
  { name: 'nidFront', maxCount: 1 },
  { name: 'nidBack', maxCount: 1 },
  { name: 'landOwnership', maxCount: 1 },
  { name: 'farmerReg', maxCount: 1 },
  { name: 'other', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      subsidyType, cropType, farmArea, expectedAmount, purpose, description, contactNumber
    } = req.body;
    const files = req.files;
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: user not found' });
    }
    if (!subsidyType || !cropType || !farmArea || !expectedAmount || !purpose || !description || !contactNumber) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const application = new SubsidyApplication({
      user: req.user.id,
      subsidyType,
      cropType,
      farmArea,
      expectedAmount,
      purpose,
      description,
      contactNumber,
      citizenshipFront: files.citizenshipFront?.[0]?.filename,
      citizenshipBack: files.citizenshipBack?.[0]?.filename,
      nidFront: files.nidFront?.[0]?.filename,
      nidBack: files.nidBack?.[0]?.filename,
      landOwnership: files.landOwnership?.[0]?.filename,
      farmerReg: files.farmerReg?.[0]?.filename,
      other: files.other?.[0]?.filename,
    });
    await application.save();
    res.json({ success: true, message: 'Application submitted', application });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// TEST: Get all subsidies (no auth)
router.get('/test-all-subsidies', async (req, res) => {
  try {
    const applications = await SubsidyApplication.find().sort({ appliedDate: -1 });
    res.json({ success: true, total: applications.length, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// FIX: Update all subsidies to correct farmer ID (run once)
router.get('/fix-all-user-ids', async (req, res) => {
  try {
    const oldMockId = '64f0c0e2b123456789abcdef';
    const correctFarmerId = '68d138450a78db87d66cb1aa';
    
    const result = await SubsidyApplication.updateMany(
      { user: oldMockId },
      { $set: { user: correctFarmerId } }
    );
    
    res.json({ 
      success: true, 
      message: `Updated ${result.modifiedCount} subsidies`,
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/subsidy/history
router.get('/history', jwtAuth, async (req, res) => {
  try {
    const farmerId = req.user.id; // Get from JWT token
    
    // Check all subsidies first
    const allApplications = await SubsidyApplication.find();
    if (allApplications.length > 0) {
    }
    
    // Try to find by farmer ID
    const applications = await SubsidyApplication.find({ user: farmerId }).sort({ appliedDate: -1 });
    
    res.json({ success: true, applications });
  } catch (err) {
    console.error('Error fetching subsidy history:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Admin: Add ongoing subsidy
router.post('/ongoing', async (req, res) => {
  try {
    // TODO: Add admin authentication check
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const subsidy = new OngoingSubsidy({ title, description });
    await subsidy.save();
    res.json({ success: true, subsidy });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Farmer: Get ongoing subsidies
router.get('/ongoing', async (req, res) => {
  try {
    const subsidies = await OngoingSubsidy.find().sort({ createdAt: -1 });
    res.json({ success: true, subsidies });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Admin: Edit ongoing subsidy
router.put('/ongoing/:id', async (req, res) => {
  try {
    const { title, description } = req.body;
    const subsidy = await OngoingSubsidy.findByIdAndUpdate(
      req.params.id,
      { title, description },
      { new: true }
    );
    if (!subsidy) return res.status(404).json({ success: false, message: 'Subsidy not found' });
    res.json({ success: true, subsidy });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Admin: Delete ongoing subsidy
router.delete('/ongoing/:id', async (req, res) => {
  try {
    const subsidy = await OngoingSubsidy.findByIdAndDelete(req.params.id);
    if (!subsidy) return res.status(404).json({ success: false, message: 'Subsidy not found' });
    res.json({ success: true, message: 'Subsidy deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Admin: Add reply to subsidy application
router.put('/reply/:id', async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply || typeof reply !== 'string') {
      return res.status(400).json({ success: false, message: 'Reply is required' });
    }
    const application = await SubsidyApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    application.adminReplies = application.adminReplies || [];
    application.adminReplies.push(reply);
    await application.save();
    res.json({ success: true, application });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
// Admin: Update status of a subsidy application (approve/reject)
router.put('/update-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    const application = await SubsidyApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json({ success: true, application });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// SCRAPED SUBSIDY ROUTES

// GET /api/subsidy/scraped - Get all scraped subsidies
router.get('/scraped', async (req, res) => {
  try {
    const { limit = 50, category, subsidyType, region } = req.query;

    let query = { isActive: true };

    if (category) query.category = category;
    if (subsidyType) query.subsidyType = subsidyType;
    if (region) query.region = region;

    const subsidies = await ScrapedSubsidy.find(query)
      .sort({ lastUpdated: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      subsidies,
      count: subsidies.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/subsidy/scraped/:id - Get specific scraped subsidy
router.get('/scraped/:id', async (req, res) => {
  try {
    const subsidy = await ScrapedSubsidy.findById(req.params.id);
    if (!subsidy) {
      return res.status(404).json({ success: false, message: 'Subsidy not found' });
    }
    res.json({ success: true, subsidy });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST /api/subsidy/scrape - Trigger manual scraping (Admin only)
router.post('/scrape', async (req, res) => {
  try {
    console.log('🔄 Starting subsidy scraping process...');

    // Run scraping
    const scrapedSubsidies = await subsidyScraper.scrapeAllSources();

    if (scrapedSubsidies.length === 0) {
      return res.json({
        success: true,
        message: 'No new subsidies found',
        scraped: 0
      });
    }

    // Update database
    const { created, updated } = await subsidyScraper.updateDatabase(scrapedSubsidies);

    res.json({
      success: true,
      message: `Successfully scraped ${scrapedSubsidies.length} subsidies`,
      scraped: scrapedSubsidies.length,
      created,
      updated
    });
  } catch (err) {
    console.error('Scraping error:', err);
    res.status(500).json({
      success: false,
      message: 'Error during scraping',
      error: err.message
    });
  }
});

// GET /api/subsidy/scraped/stats - Get scraping statistics
router.get('/scraped/stats', async (req, res) => {
  try {
    const total = await ScrapedSubsidy.countDocuments({ isActive: true });
    const byType = await ScrapedSubsidy.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$subsidyType', count: { $sum: 1 } } }
    ]);
    const bySource = await ScrapedSubsidy.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$sourceName', count: { $sum: 1 } } }
    ]);

    const lastUpdated = await ScrapedSubsidy.findOne()
      .sort({ lastUpdated: -1 })
      .select('lastUpdated');

    res.json({
      success: true,
      stats: {
        total,
        byType,
        bySource,
        lastUpdated: lastUpdated?.lastUpdated || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT /api/subsidy/scraped/:id/toggle - Toggle subsidy active status (Admin only)
router.put('/scraped/:id/toggle', async (req, res) => {
  try {
    const subsidy = await ScrapedSubsidy.findById(req.params.id);
    if (!subsidy) {
      return res.status(404).json({ success: false, message: 'Subsidy not found' });
    }

    subsidy.isActive = !subsidy.isActive;
    await subsidy.save();

    res.json({
      success: true,
      subsidy,
      message: `Subsidy ${subsidy.isActive ? 'activated' : 'deactivated'}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;