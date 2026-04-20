const express = require('express');
const router = express.Router();
const Expert = require('../models/Expert');
const ExpertMessage = require('../models/ExpertMessage');
const ExpertBooking = require('../models/ExpertBooking');
const jwtAuth = require('../middleware/jwtAuth');

// Get all experts with filtering and search
router.get('/', async (req, res) => {
  try {
    const { search, crop, district, onlineOnly } = req.query;
    let filter = {};

    if (onlineOnly === 'true') {
      filter.isOnline = true;
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { role: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') },
        { crops: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (crop) {
      filter.crops = { $in: [new RegExp(crop, 'i')] };
    }

    if (district) {
      filter.district = new RegExp(district, 'i');
    }

    const experts = await Expert.find(filter)
      .sort({ isOnline: -1, rating: -1, name: 1 })
      .limit(50);

    // Add response time and availability info
    const expertsWithStats = await Promise.all(
      experts.map(async (expert) => {
        const messageCount = await ExpertMessage.countDocuments({
          expertId: expert._id,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        });

        const avgResponseTime = await ExpertMessage.aggregate([
          { $match: { expertId: expert._id, responseTime: { $exists: true } } },
          { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
        ]);

        return {
          ...expert.toObject(),
          stats: {
            totalConsultations: messageCount,
            avgResponseTime: avgResponseTime[0]?.avgTime || null,
            isAvailable: expert.isOnline && expert.isActive
          }
        };
      })
    );

    res.json({ success: true, experts: expertsWithStats });
  } catch (err) {
    console.error('Expert fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch experts' });
  }
});

// Create new expert (admin only)
router.post('/', jwtAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const { name, role, crops, specialization, phone, email, whatsapp, district, bio, experience, languages, certifications, consultationFee } = req.body;

    if (!name || !role || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, role, email, and phone are required' 
      });
    }

    // Check if email already exists
    const existing = await Expert.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Expert with this email already exists' 
      });
    }

    const expert = new Expert({
      name,
      role,
      crops: crops || [],
      specialization: specialization || [],
      phone,
      email: email.toLowerCase(),
      whatsapp,
      district,
      bio,
      experience: experience || 0,
      languages: languages || ['Nepali', 'English'],
      certifications: certifications || [],
      consultationFee: consultationFee || 0,
      isActive: true,
      isOnline: false
    });

    await expert.save();

    res.status(201).json({
      success: true,
      message: 'Expert created successfully',
      expert
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get expert by ID with full details
router.get('/:id', async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert not found' });
    }

    // Get recent activity
    const recentMessages = await ExpertMessage.find({
      expertId: expert._id
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('farmerId', 'name location');

    res.json({
      success: true,
      expert: {
        ...expert.toObject(),
        recentActivity: recentMessages
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Send message to expert
router.post('/message', jwtAuth, async (req, res) => {
  try {
    const { expertId, message, priority = 'normal' } = req.body;
    const farmerId = req.user.id;

    if (!expertId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Expert ID and message are required'
      });
    }

    // Check if expert exists and is active
    const expert = await Expert.findById(expertId);
    if (!expert || !expert.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found or unavailable'
      });
    }

    const newMessage = new ExpertMessage({
      farmerId,
      expertId,
      message,
      priority,
      status: 'sent'
    });

    await newMessage.save();

    // Update expert's last activity
    await Expert.findByIdAndUpdate(expertId, {
      lastActivity: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      messageId: newMessage._id
    });
  } catch (err) {
    console.error('Message send error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Get conversation between farmer and expert
router.get('/conversation/:expertId', jwtAuth, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const expertId = req.params.expertId;

    const messages = await ExpertMessage.find({
      farmerId,
      expertId
    })
    .sort({ createdAt: 1 })
    .populate('expertId', 'name role')
    .populate('farmerId', 'name');

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Edit expert details (admin only)
router.put('/:id', jwtAuth, async (req, res) => {
  try {
    console.log('=== EXPERT UPDATE REQUEST ===');
    console.log('PUT request received for expert ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User role:', req.user.role);
    console.log('Phone in request:', req.body.phone);
    console.log('WhatsApp in request:', req.body.whatsapp);

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const updates = req.body;

    // Allowed fields to update
    const allowedFields = [
      'name', 'role', 'crops', 'specialization', 'phone', 'email',
      'whatsapp', 'district', 'bio', 'experience', 'languages',
      'certifications', 'consultationFee', 'isActive'
    ];

    // Filter updates to only allowed fields
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    console.log('Filtered updates:', JSON.stringify(filteredUpdates, null, 2));
    console.log('Phone in filtered updates:', filteredUpdates.phone);

    const expert = await Expert.findByIdAndUpdate(
      id,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    );

    console.log('Updated expert:', expert ? { name: expert.name, phone: expert.phone, whatsapp: expert.whatsapp } : 'Not found');

    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert not found' });
    }

    res.json({ 
      success: true, 
      message: 'Expert updated successfully',
      expert 
    });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete expert (admin only)
router.delete('/:id', jwtAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const expert = await Expert.findByIdAndDelete(req.params.id);
    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert not found' });
    }

    res.json({ 
      success: true, 
      message: 'Expert deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update expert online status (expert only)
router.put('/status', jwtAuth, async (req, res) => {
  try {
    const { isOnline } = req.body;
    const expertId = req.user.id;

    // Check if user is an expert
    const expert = await Expert.findById(expertId);
    if (!expert) {
      return res.status(403).json({
        success: false,
        message: 'Only experts can update status'
      });
    }

    await Expert.findByIdAndUpdate(expertId, {
      isOnline: Boolean(isOnline),
      lastSeen: new Date()
    });

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get expert statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalExperts = await Expert.countDocuments({ isActive: true });
    const onlineExperts = await Expert.countDocuments({ isActive: true, isOnline: true });
    const totalMessages = await ExpertMessage.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const topCrops = await Expert.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$crops' },
      { $group: { _id: '$crops', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        totalExperts,
        onlineExperts,
        totalMessages,
        topCrops
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// EXPERT BOOKING ROUTES

// POST /api/experts/bookings - Create expert booking
router.post('/bookings', async (req, res) => {
  try {
    const {
      expertId,
      farmerId,
      farmerName,
      farmerEmail,
      expertName,
      expertise,
      consultationFee,
      scheduledDate,
      scheduledTime,
      topic,
      description,
      paymentTransactionId
    } = req.body;

    // Check availability
    const existingBooking = await ExpertBooking.findOne({
      expertId,
      scheduledDate,
      scheduledTime,
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Expert is not available at this time'
      });
    }

    // Create booking
    const booking = new ExpertBooking({
      expertId,
      farmerId,
      farmerName,
      farmerEmail,
      expertName,
      expertise,
      consultationFee,
      scheduledDate,
      scheduledTime,
      topic,
      description,
      status: 'pending',
      paymentStatus: paymentTransactionId ? 'completed' : 'pending',
      paymentTransactionId
    });

    await booking.save();

    res.json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
});

// GET /api/experts/bookings - Get all bookings (admin)
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await ExpertBooking.find()
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// GET /api/experts/:expertId/bookings - Get bookings for specific expert
router.get('/:expertId/bookings', async (req, res) => {
  try {
    const bookings = await ExpertBooking.find({
      expertId: req.params.expertId
    }).sort({ scheduledDate: -1 });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// GET /api/experts/:expertId/availability - Check expert availability
router.get('/:expertId/availability', async (req, res) => {
  try {
    const { date, time } = req.query;

    const booking = await ExpertBooking.findOne({
      expertId: req.params.expertId,
      scheduledDate: date,
      scheduledTime: time,
      status: { $ne: 'cancelled' }
    });

    res.json({
      success: true,
      available: !booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking availability',
      error: error.message
    });
  }
});

// PUT /api/experts/bookings/:bookingId - Update booking status
router.put('/bookings/:bookingId', async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    const booking = await ExpertBooking.findByIdAndUpdate(
      req.params.bookingId,
      {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus })
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking updated',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
});

// DELETE /api/experts/bookings/:bookingId - Cancel booking
router.delete('/bookings/:bookingId', async (req, res) => {
  try {
    const booking = await ExpertBooking.findByIdAndUpdate(
      req.params.bookingId,
      { status: 'cancelled' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking cancelled',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
});

// POST /api/experts/bookings/payment - Process payment and create booking
router.post('/bookings/payment', async (req, res) => {
  try {
    const {
      expertId,
      farmerId,
      farmerName,
      farmerEmail,
      expertName,
      expertise,
      consultationFee,
      scheduledDate,
      scheduledTime,
      topic,
      description,
      paymentMethod,
      selectedBank,
      amount,
      paymentTransactionId,
      paymentRef
    } = req.body;

    // Validation
    if (!expertId || !farmerId || !paymentMethod || !paymentTransactionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment fields'
      });
    }

    // Verify payment amount matches consultation fee
    if (parseInt(amount) !== parseInt(consultationFee)) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount does not match consultation fee'
      });
    }

    // Check expert availability
    const existingBooking = await ExpertBooking.findOne({
      expertId,
      scheduledDate,
      scheduledTime,
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Expert is not available at this time. Please select another slot.'
      });
    }

    // Create booking with payment info
    const booking = new ExpertBooking({
      expertId,
      farmerId,
      farmerName,
      farmerEmail,
      expertName,
      expertise,
      consultationFee,
      scheduledDate,
      scheduledTime,
      topic,
      description,
      status: 'confirmed',
      paymentStatus: 'completed',
      paymentMethod,
      selectedBank: paymentMethod === 'bank_transfer' ? selectedBank : null,
      paymentTransactionId,
      paymentReference: paymentRef,
      paymentDate: new Date()
    });

    await booking.save();

    // Generate booking reference
    const bookingRef = `BOOK-${booking._id.toString().slice(-6).toUpperCase()}`;

    res.json({
      success: true,
      message: 'Payment processed and booking confirmed successfully',
      booking: {
        ...booking.toObject(),
        bookingReference: bookingRef
      }
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
});

module.exports = router;