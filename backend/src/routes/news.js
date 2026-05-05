const express = require('express');
const router = express.Router();

const NEWS_FEED = [
  { id: 1, headline: 'Reliance Industries Q3 profit beats Street estimates; EBITDA up 12% YoY', symbol: 'RELIANCE.NS', sector: 'Energy', sentiment: 'bullish', source: 'Economic Times', time: '2m ago', score: 0.78 },
  { id: 2, headline: 'TCS wins $500M multi-year deal from UK financial services major', symbol: 'TCS.NS', sector: 'IT', sentiment: 'bullish', source: 'Business Standard', time: '8m ago', score: 0.85 },
  { id: 3, headline: 'Infosys revises FY24 revenue guidance lower amid macro headwinds in Europe', symbol: 'INFY.NS', sector: 'IT', sentiment: 'bearish', source: 'Mint', time: '15m ago', score: -0.62 },
  { id: 4, headline: 'HDFC Bank net interest margin stable at 4.1%; asset quality remains healthy', symbol: 'HDFCBANK.NS', sector: 'Banking', sentiment: 'neutral', source: 'Bloomberg', time: '22m ago', score: 0.12 },
  { id: 5, headline: 'Nifty 50 opens flat amid mixed global cues; IT stocks lead gains', symbol: '^NSEI', sector: 'Market', sentiment: 'neutral', source: 'MoneyControl', time: '30m ago', score: 0.05 },
  { id: 6, headline: 'Bajaj Finance shows early signs of NPA stress in SME book; analysts turn cautious', symbol: 'BAJFINANCE.NS', sector: 'Finance', sentiment: 'bearish', source: 'Reuters', time: '45m ago', score: -0.71 },
  { id: 7, headline: 'Titan Q3 jewellery revenue jumps 25% on festive demand surge, beats estimates', symbol: 'TITAN.NS', sector: 'Consumer', sentiment: 'bullish', source: 'CNBC-TV18', time: '1h ago', score: 0.82 },
  { id: 8, headline: 'Crude oil rises 1.8% as OPEC+ signals production cut extension through Q2 2024', symbol: 'ONGC.NS', sector: 'Energy', sentiment: 'bullish', source: 'Reuters', time: '1h ago', score: 0.55 },
  { id: 9, headline: 'Wipro secures $300M AI transformation deal with European automotive giant', symbol: 'WIPRO.NS', sector: 'IT', sentiment: 'bullish', source: 'ET Markets', time: '2h ago', score: 0.76 },
  { id: 10, headline: 'RBI keeps repo rate unchanged at 6.5%; stance remains withdrawal of accommodation', symbol: '^NSEI', sector: 'Market', sentiment: 'neutral', source: 'Hindu BusinessLine', time: '2h ago', score: 0.02 },
  { id: 11, headline: 'Maruti Suzuki January sales hit record; SUV segment grows 34% YoY', symbol: 'MARUTI.NS', sector: 'Auto', sentiment: 'bullish', source: 'Auto Today', time: '3h ago', score: 0.88 },
  { id: 12, headline: 'FIIs turn net sellers; pull out ₹4,200 crore from Indian equities in week', symbol: '^NSEI', sector: 'Market', sentiment: 'bearish', source: 'Moneycontrol', time: '3h ago', score: -0.58 },
  { id: 13, headline: 'ICICI Bank Q3 net profit up 23%; asset quality at decade-best levels', symbol: 'ICICIBANK.NS', sector: 'Banking', sentiment: 'bullish', source: 'Economic Times', time: '4h ago', score: 0.91 },
  { id: 14, headline: 'Tata Steel faces headwinds from weak European demand; UK operations in focus', symbol: 'TATASTEEL.NS', sector: 'Metals', sentiment: 'bearish', source: 'Bloomberg', time: '4h ago', score: -0.48 },
  { id: 15, headline: 'Sun Pharma US FDA inspection of Halol plant completes without observations', symbol: 'SUNPHARMA.NS', sector: 'Pharma', sentiment: 'bullish', source: 'Mint', time: '5h ago', score: 0.69 },
];

// Get all news
router.get('/', (req, res) => {
  const { symbol, sentiment, limit = 20 } = req.query;
  let news = [...NEWS_FEED];
  if (symbol) news = news.filter(n => n.symbol === symbol || n.symbol === '^NSEI');
  if (sentiment) news = news.filter(n => n.sentiment === sentiment);
  res.json({ news: news.slice(0, parseInt(limit)), total: news.length });
});

// Get news for a specific symbol
router.get('/:symbol', (req, res) => {
  const { symbol } = req.params;
  const news = NEWS_FEED.filter(n =>
    n.symbol === symbol ||
    n.symbol.replace('.NS', '') === symbol ||
    n.symbol === '^NSEI'
  );
  res.json({ news, symbol });
});

module.exports = router;
