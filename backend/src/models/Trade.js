const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true, uppercase: true },
  stockName: { type: String },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  orderType: { type: String, enum: ['MARKET', 'LIMIT', 'SL'], default: 'MARKET' },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  totalValue: { type: Number, required: true },
  stopLoss: { type: Number },
  target: { type: Number },
  status: { type: String, enum: ['PENDING', 'EXECUTED', 'CANCELLED'], default: 'EXECUTED' },
  pnl: { type: Number, default: 0 },
  pnlPct: { type: Number, default: 0 },
  exchange: { type: String, default: 'NSE' },
  executedAt: { type: Date, default: Date.now },
}, { timestamps: true });

tradeSchema.index({ userId: 1, symbol: 1 });
tradeSchema.index({ userId: 1, executedAt: -1 });

module.exports = mongoose.model('Trade', tradeSchema);
