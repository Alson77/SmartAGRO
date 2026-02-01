const express = require('express');
const router = express.Router();
const axios = require('axios');

// Kalimati API endpoint (used internally)
const SMART_AGRO_API_URL = 'https://kalimatimarket.gov.np/api/daily-prices/en';

router.get('/market-prices', async (req, res) => {
  const market = req.query.market;

  // Change validation to Smart Agro Market
  if (market !== 'smart-agro') {
    return res.status(400).json({
      message: 'Only Smart Agro Market is supported.'
    });
  }

  try {
    const response = await axios.get(SMART_AGRO_API_URL);

    // Send prices to frontend
    res.json({
      market: 'Smart Agro Market',
      prices: response.data.prices
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch market prices',
      error: err.message
    });
  }
});

module.exports = router;
