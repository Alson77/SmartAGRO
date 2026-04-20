const express = require('express');
const router = express.Router();
const axios = require('axios');
const MarketPrice = require('../models/MarketPrice');

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

// Fallback static data for when all APIs fail
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
  },
  {
    commodityname: 'Rice',
    commodityunit: 'KG',
    minprice: '45.00',
    maxprice: '55.00',
    avgprice: '50.00'
  },
  {
    commodityname: 'Wheat',
    commodityunit: 'KG',
    minprice: '40.00',
    maxprice: '50.00',
    avgprice: '45.00'
  }
];

// Fetch from multiple sources with fallback
const fetchMarketPrices = async () => {
  for (const source of MARKET_SOURCES.sort((a, b) => a.priority - b.priority)) {
    if (!source.active) continue;

    try {
      console.log(`🔄 Trying to fetch from ${source.name}...`);
      const response = await axios.get(source.url, {
        timeout: 10000, // 10 second timeout
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

  // If all APIs fail, return fallback data
  console.log('⚠️ All APIs failed, using fallback data');
  return {
    prices: FALLBACK_PRICES,
    source: 'Fallback Data',
    timestamp: new Date(),
    isFallback: true
  };
};

router.get('/market-prices', async (req, res) => {
  const market = req.query.market || 'kalimati';

  try {
    // Try to fetch from database first (if data is less than 4 hours old)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    let marketData = await MarketPrice.findOne({
      market,
      lastUpdated: { $gte: fourHoursAgo }
    }).sort({ lastUpdated: -1 });

    let source = 'Database Cache';

    // If no recent data, fetch from APIs
    if (!marketData) {
      console.log('📡 Fetching fresh market data...');
      const freshData = await fetchMarketPrices();

      // Update or create in DB
      marketData = await MarketPrice.findOneAndUpdate(
        { market },
        {
          prices: freshData.prices,
          lastUpdated: freshData.timestamp,
          source: freshData.source,
          isFallback: freshData.isFallback || false
        },
        { upsert: true, new: true }
      );

      source = freshData.source;
    }

    // Send prices to frontend
    res.json({
      market: market === 'kalimati' ? 'Kalimati Market' : `${market} Market`,
      prices: marketData.prices,
      source: marketData.source || source,
      lastUpdated: marketData.lastUpdated,
      isFallback: marketData.isFallback || false
    });

  } catch (err) {
    console.error('❌ Market prices error:', err);

    // Emergency fallback
    res.status(500).json({
      market: 'Market Data',
      prices: FALLBACK_PRICES,
      source: 'Emergency Fallback',
      lastUpdated: new Date(),
      isFallback: true,
      error: 'All data sources unavailable'
    });
  }
});

// Admin endpoint to manually refresh market data
router.post('/refresh-prices', async (req, res) => {
  try {
    console.log('🔄 Manual refresh of market prices...');
    const freshData = await fetchMarketPrices();

    const marketData = await MarketPrice.findOneAndUpdate(
      { market: 'kalimati' },
      {
        prices: freshData.prices,
        lastUpdated: freshData.timestamp,
        source: freshData.source,
        isFallback: freshData.isFallback || false
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Market prices refreshed successfully',
      source: freshData.source,
      lastUpdated: marketData.lastUpdated
    });

  } catch (err) {
    console.error('❌ Manual refresh failed:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh market prices',
      error: err.message
    });
  }
});

module.exports = router;
