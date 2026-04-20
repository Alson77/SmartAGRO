require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');
const MarketPrice = require('./models/MarketPrice');

// Routes
const authRoutes = require('./routes/auth');
const farmerRoutes = require('./routes/farmer');
const passwordRoutes = require('./routes/password');
const adminRoutes = require('./routes/admin');
const issueRoutes = require('./routes/issues');
const subsidyRoutes = require('./routes/subsidy');
const chatRoutes = require('./routes/chat');
const marketRoutes = require('./routes/market');
const diseaseRoutes = require('./routes/disease');
const expertRoutes = require('./routes/expertRoutes');

// Initialize subsidy scheduler
const subsidyScheduler = require('./services/subsidyScheduler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); // ✅ no options needed
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Stop server if DB connection fails
  }
};

connectDB();

// Schedule daily market price update at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 Updating market prices...');
  try {
    const axios = require('axios');
    const MarketPrice = require('./models/MarketPrice');

    // Multiple API sources for market prices with fallback
    const MARKET_SOURCES = [
      {
        name: 'Kalimati Official',
        url: 'https://kalimatimarket.gov.np/api/daily-prices/en',
        priority: 1,
        active: true
      },
      {
        name: 'Nepal Agriculture API',
        url: 'https://api.nepalagriculture.gov.np/market-prices',
        priority: 2,
        active: true
      },
      {
        name: 'Ministry of Agriculture',
        url: 'https://moald.gov.np/api/market-data',
        priority: 3,
        active: true
      }
    ];

    // Fallback static data
    const FALLBACK_PRICES = [
      {
        commodityname: 'Tomato Big(Indian)',
        commodityunit: 'KG',
        minprice: '70.00',
        maxprice: '80.00',
        avgprice: '75.00'
      },
      {
        commodityname: 'Potato Red',
        commodityunit: 'KG',
        minprice: '15.00',
        maxprice: '20.00',
        avgprice: '17.50'
      },
      {
        commodityname: 'Onion Dry (Indian)',
        commodityunit: 'KG',
        minprice: '34.00',
        maxprice: '36.00',
        avgprice: '35.00'
      }
    ];

    // Fetch from multiple sources with fallback
    const fetchMarketPrices = async () => {
      for (const source of MARKET_SOURCES.sort((a, b) => a.priority - b.priority)) {
        if (!source.active) continue;

        try {
          console.log(`🔄 Trying to fetch from ${source.name}...`);
          const response = await axios.get(source.url, {
            timeout: 15000,
            headers: {
              'User-Agent': 'SmartAGRO-App/1.0'
            }
          });

          if (response.data && response.data.prices) {
            console.log(`✅ Successfully fetched from ${source.name}`);
            return {
              prices: response.data.prices,
              source: source.name,
              timestamp: new Date()
            };
          }
        } catch (error) {
          console.warn(`❌ Failed to fetch from ${source.name}:`, error.message);
          continue;
        }
      }

      console.log('⚠️ All APIs failed, using fallback data');
      return {
        prices: FALLBACK_PRICES,
        source: 'Fallback Data',
        timestamp: new Date(),
        isFallback: true
      };
    };

    const freshData = await fetchMarketPrices();
    await MarketPrice.findOneAndUpdate(
      { market: 'kalimati' },
      {
        prices: freshData.prices,
        lastUpdated: freshData.timestamp,
        source: freshData.source,
        isFallback: freshData.isFallback || false
      },
      { upsert: true, new: true }
    );
    console.log('✅ Market prices updated successfully from', freshData.source);
  } catch (error) {
    console.error('❌ Failed to update market prices:', error.message);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/subsidy', subsidyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/disease', diseaseRoutes);
app.use('/api/market', marketRoutes); // explicit /api/market
app.use('/api/experts', expertRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err?.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  if (err?.message?.includes('Only image files are allowed')) {
    return res.status(400).json({ message: err.message });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

// Start Server
const PORT = process.env.PORT || 5000;

// Initialize automated subsidy scraping
subsidyScheduler.startDailyScraping();

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
