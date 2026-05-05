const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true, uppercase: true },
  stockName: { type: String },
  exchange: { type: String, default: 'NSE' },
  sector: { type: String },
  alertPrice: { type: Number },
  alertType: { type: String, enum: ['ABOVE', 'BELOW', null], default: null },
  notes: { type: String },
  addedAt: { type: Date, default: Date.now },
}, { timestamps: true });

watchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
