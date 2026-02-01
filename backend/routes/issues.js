const express = require('express');
const mongoose = require('mongoose');
const CropIssue = require('../models/CropIssue');
const Farmer = require('../models/Farmer');
const multer = require('multer');
const path = require('path');
const jwtAuth = require('../middleware/jwtAuth');
const router = express.Router();
// PATCH /api/issues/:id/status - update issue status (admin only, JWT auth)
router.patch('/:id/status', jwtAuth, async (req, res) => {
	try {
		const { status } = req.body;
		if (!['open', 'in_progress', 'resolved'].includes(status)) {
			return res.status(400).json({ message: 'Invalid status value' });
		}
		const issue = await CropIssue.findByIdAndUpdate(
			req.params.id,
			{ status },
			{ new: true }
		);
		if (!issue) return res.status(404).json({ message: 'Issue not found' });
		res.json({ message: 'Status updated', issue });
	} catch (err) {
		res.status(500).json({ message: 'Error updating status', error: err.message });
	}
});

// Multer setup for image uploads
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

// ============================================
// SPECIFIC ROUTES FIRST (before /:id route)
// ============================================

// GET /api/issues/debug/collections - debug endpoint to check database
router.get('/debug/collections', async (req, res) => {
	try {
		const db = mongoose.connection.db;
		const collections = await db.listCollections().toArray();
		const collectionNames = collections.map(c => c.name);
		
		// Get count from each collection
		const counts = {};
		for (const name of collectionNames) {
			const count = await db.collection(name).countDocuments();
			counts[name] = count;
		}
		
		// Get sample farmers
		const Farmer = require('../models/Farmer');
		const sampleFarmers = await Farmer.find({}).limit(3).select('_id name email');
		
		// Get all issues to see if any exist
		const allIssues = await CropIssue.find({}).select('title farmer createdAt');
		
		res.json({
			database: mongoose.connection.name,
			collections: counts,
			cropIssuesModelCollection: CropIssue.collection.name,
			sampleFarmers: sampleFarmers.map(f => ({ 
				id: f._id.toString(), 
				name: f.name, 
				email: f.email 
			})),
			allIssues: allIssues.map(i => ({
				id: i._id.toString(),
				title: i.title,
				farmer: i.farmer ? i.farmer.toString() : null,
				createdAt: i.createdAt
			}))
		});
	} catch (err) {
		res.status(500).json({ message: 'Error checking collections', error: err.message });
	}
});

// GET /api/issues/debug/create-test - create a test issue to verify DB works
router.get('/debug/create-test', async (req, res) => {
	try {
		const Farmer = require('../models/Farmer');
		const firstFarmer = await Farmer.findOne({});
		
		if (!firstFarmer) {
			return res.status(400).json({ message: 'No farmers found in database' });
		}
		
		const testIssue = new CropIssue({
			title: 'Debug Test Issue',
			category: 'Pest',
			severity: 'low',
			location: 'Test Location',
			description: 'This is a test issue created by debug endpoint',
			urgency: false,
			farmer: firstFarmer._id
		});
		
		await testIssue.save();
		
		const issueCount = await CropIssue.countDocuments();
		
		res.json({
			message: 'Test issue created successfully',
			issue: {
				id: testIssue._id,
				title: testIssue.title,
				farmer: testIssue.farmer,
				farmerName: firstFarmer.name
			},
			totalIssuesInDB: issueCount
		});
	} catch (err) {
		res.status(500).json({ message: 'Error creating test issue', error: err.message });
	}
});

// GET /api/issues/my-issues - get issues for authenticated farmer
router.get('/my-issues', jwtAuth, async (req, res) => {
    try {
        const farmerId = req.user.id; // from JWT token
        // First, let's see ALL issues in the database
        const allIssues = await CropIssue.find({});
        // Now find issues for this farmer
        const issues = await CropIssue.find({ farmer: farmerId })
            .sort({ reportedDate: -1 })
            .populate('farmer', 'name email');
        res.json(issues);
    } catch (err) {
        console.error('Error in /my-issues:', err);
        res.status(500).json({ message: 'Error fetching issues', error: err.message });
    }
});

// ============================================
// GENERAL ROUTES
// ============================================

// POST /api/issues - create a new crop issue
router.post('/', upload.array('images', 5), async (req, res) => {
    try {
        const { title, category, severity, location, description, urgency, farmerId } = req.body;
        if (!farmerId) {
            // No farmerId provided
        }
        const images = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];
        const issue = new CropIssue({
            title,
            category,
            severity,
            location,
            description,
            urgency: urgency === 'true' || urgency === true,
            images,
            farmer: farmerId || null
        });
        await issue.save();
        res.status(201).json({ message: 'Issue reported successfully', issue });
    } catch (err) {
        console.error('❌ Error creating issue:', err);
        res.status(500).json({ message: 'Error reporting issue', error: err.message });
    }
});

// GET /api/issues?farmerId=... - get all issues (optionally for a farmer)
router.get('/', async (req, res) => {
	try {
		const { farmerId } = req.query;
		let query = {};
		if (farmerId) query.farmer = farmerId;
		const issues = await CropIssue.find(query).sort({ reportedDate: -1 }).populate('farmer', 'name email');
		res.json(issues);
	} catch (err) {
		res.status(500).json({ message: 'Error fetching issues', error: err.message });
	}
});

// ============================================
// DYNAMIC ROUTES (must be last)
// ============================================

// POST /api/issues/:id/reply - add a reply to an issue (admin or farmer)
router.post('/:id/reply', async (req, res) => {
	try {
		const { message, adminId, farmerId } = req.body;
		if (!message || (!adminId && !farmerId)) {
			return res.status(400).json({ message: 'Message and adminId or farmerId required' });
		}
		let reply = { message, createdAt: new Date() };
		if (adminId) {
			reply = { ...reply, senderType: 'admin', admin: adminId };
		} else if (farmerId) {
			reply = { ...reply, senderType: 'farmer', farmer: farmerId };
		}
		const issue = await CropIssue.findByIdAndUpdate(
			req.params.id,
			{ $push: { replies: reply } },
			{ new: true }
		).populate('replies.admin', 'name email').populate('replies.farmer', 'name email');
		if (!issue) return res.status(404).json({ message: 'Issue not found' });
		res.json({ message: 'Reply added', issue });
	} catch (err) {
		res.status(500).json({ message: 'Error adding reply', error: err.message });
	}
});

// GET /api/issues/:id - get a single issue with replies
router.get('/:id', async (req, res) => {
	try {
		const issue = await CropIssue.findById(req.params.id)
			.populate('replies.admin', 'name email role')
			.populate('replies.farmer', 'name email _id');
		if (!issue) return res.status(404).json({ message: 'Issue not found' });
		res.json(issue);
	} catch (err) {
		res.status(500).json({ message: 'Error fetching issue', error: err.message });
	}
});

module.exports = router;