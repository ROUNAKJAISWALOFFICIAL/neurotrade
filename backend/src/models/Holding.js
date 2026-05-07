const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  qty: { type: Number, required: true, default: 0 },
  avgPrice: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

holdingSchema.index({ userId: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Holding', holdingSchema);