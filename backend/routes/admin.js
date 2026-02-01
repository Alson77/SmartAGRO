const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Farmer = require('../models/Farmer');
const Admin = require('../models/Admin');
const SubsidyApplication = require('../models/SubsidyApplication');
const CropIssue = require('../models/CropIssue');

// Admin login using Admin collection
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // Compare password
    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt
      }
    });
  } catch (err) {
    console.error('Error:', err.message); // Log the error
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all farmers (admin only)
// Initialize lastLogin for existing farmers (run once)
router.get('/init-last-login', async (req, res) => {
  try {
    const result = await Farmer.updateMany(
      { lastLogin: { $exists: false } },
      { $set: { lastLogin: null } }
    );
    res.json({ 
      success: true, 
      message: `Initialized lastLogin for ${result.modifiedCount} farmers`,
      modified: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to initialize', error: err.message });
  }
});

router.get('/farmers', async (req, res) => {
  // In production, add JWT auth middleware and check admin role
  try {
    const farmers = await Farmer.find();
    
    // Add subsidy and issue counts for each farmer
    const farmersWithCounts = await Promise.all(
      farmers.map(async (farmer) => {
        const subsidyCount = await SubsidyApplication.countDocuments({ user: farmer._id });
        const issueCount = await CropIssue.countDocuments({ farmer: farmer._id });
        
        return {
          ...farmer.toObject(),
          subsidyApplications: subsidyCount,
          issuesReported: issueCount
        };
      })
    );
    
    res.json(farmersWithCounts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch farmers', error: err.message });
  }
});

// Dashboard stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalFarmers = await Farmer.countDocuments();
    const totalIssues = await CropIssue.countDocuments();
    const pendingSubsidies = await SubsidyApplication.countDocuments({ status: 'pending' });
    
    res.json({
      totalFarmers,
      totalIssues,
      pendingSubsidies
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
});

// Issues category
router.get('/issues-category', async (req, res) => {
  try {
    const issues = await CropIssue.find();
    const categoryCounts = {};
    
    issues.forEach(issue => {
      const category = issue.category || 'Other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    res.json(categoryCounts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
});

// Recent farmers
router.get('/recent-farmers', async (req, res) => {
  try {
    const farmers = await Farmer.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching farmers', error: err.message });
  }
});

// Recent issues
router.get('/recent-issues', async (req, res) => {
  try {
    const issues = await CropIssue.find()
      .sort({ reportedDate: -1 })
      .limit(5)
      .select('title status reportedDate category')
      .populate('farmer', 'name');
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching issues', error: err.message });
  }
});

// Recent subsidies
router.get('/recent-subsidies', async (req, res) => {
  try {
    const subsidies = await SubsidyApplication.find()
      .sort({ appliedDate: -1 })
      .limit(5)
      .select('subsidyType status appliedDate')
      .populate('user', 'name');
    
    const formatted = subsidies.map(s => ({
      farmerName: s.user?.name || 'Unknown',
      subsidyType: s.subsidyType,
      status: s.status,
      appliedDate: s.appliedDate
    }));
    
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subsidies', error: err.message });
  }
});

// Subsidy trends by month (with period filter)
router.get('/subsidy-trends', async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 12; // Default 12 months
    const subsidies = await SubsidyApplication.find().select('appliedDate');
    
    // Initialize months based on period
    const monthsData = {};
    const now = new Date();
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsData[key] = 0;
    }
    
    // Count subsidies per month
    subsidies.forEach(subsidy => {
      if (subsidy.appliedDate) {
        const date = new Date(subsidy.appliedDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthsData.hasOwnProperty(key)) {
          monthsData[key]++;
        }
      }
    });
    
    // Format for chart
    const chartData = Object.entries(monthsData).map(([month, count]) => ({
      month,
      count
    }));
    
    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subsidy trends', error: err.message });
  }
});

// Farmer registration trends by month (with period filter)
router.get('/farmer-trends', async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 12; // Default 12 months
    const farmers = await Farmer.find().select('createdAt');
    
    // Initialize months based on period
    const monthsData = {};
    const now = new Date();
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsData[key] = 0;
    }
    
    // Count farmers per month
    farmers.forEach(farmer => {
      if (farmer.createdAt) {
        const date = new Date(farmer.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthsData.hasOwnProperty(key)) {
          monthsData[key]++;
        }
      }
    });
    
    // Format for chart
    const chartData = Object.entries(monthsData).map(([month, count]) => ({
      month,
      count
    }));
    
    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching farmer trends', error: err.message });
  }
});

// Crop issue trends by month (with period filter)
router.get('/issue-trends', async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 12; // Default 12 months
    const issues = await CropIssue.find().select('reportedDate');
    
    // Initialize months based on period
    const monthsData = {};
    const now = new Date();
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsData[key] = 0;
    }
    
    // Count issues per month
    issues.forEach(issue => {
      if (issue.reportedDate) {
        const date = new Date(issue.reportedDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthsData.hasOwnProperty(key)) {
          monthsData[key]++;
        }
      }
    });
    
    // Format for chart
    const chartData = Object.entries(monthsData).map(([month, count]) => ({
      month,
      count
    }));
    
    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching issue trends', error: err.message });
  }
});

// Issue severity distribution
router.get('/issue-severity-stats', async (req, res) => {
  try {
    const issues = await CropIssue.find().select('severity');
    
    const stats = {
      low: 0,
      medium: 0,
      high: 0
    };
    
    issues.forEach(issue => {
      if (issue.severity === 'low') stats.low++;
      else if (issue.severity === 'medium') stats.medium++;
      else if (issue.severity === 'high') stats.high++;
    });
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching severity stats', error: err.message });
  }
});

module.exports = router;