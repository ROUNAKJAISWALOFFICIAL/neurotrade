const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true, uppercase: true },
  stockName: { type: String },
  exchange: { type: String, default: 'NSE' },
  sector: { type: String },
  quantity: { type: Number, required: true, default: 0 },
  avgPrice: { type: Number, required: true },
  totalInvested: { type: Number, required: true },
  currentPrice: { type: Number },
  currentValue: { type: Number },
  unrealizedPnl: { type: Number, default: 0 },
  unrealizedPnlPct: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

holdingSchema.index({ userId: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Holding', holdingSchema);
