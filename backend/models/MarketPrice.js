const mongoose = require('mongoose');

const MarketPriceSchema = new mongoose.Schema({
  market: { type: String, required: true }, // e.g., 'kalimati'
  prices: [{
    commodityname: { type: String, required: true },
    minprice: { type: String, required: true },
    maxprice: { type: String, required: true },
    avgprice: { type: String, required: true },
    commodityunit: { type: String, required: true }
  }],
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MarketPrice', MarketPriceSchema);