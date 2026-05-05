import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore, STOCKS } from '../store';

const NEWS = [
  { id:1, headline:'Reliance Industries Q3 profit beats Street estimates; EBITDA up 12% YoY — analysts raise target price', symbol:'RELIANCE.NS', sector:'Energy', sentiment:'bullish', source:'Economic Times', time:'2m ago', score:0.78, summary:'RIL reported consolidated net profit of ₹17,265 crore, up 10.6% year-on-year, driven by strong performance in O2C and digital services segments.' },
  { id:2, headline:'TCS wins $500M multi-year digital transformation deal from UK financial services giant', symbol:'TCS.NS', sector:'IT', sentiment:'bullish', source:'Business Standard', time:'8m ago', score:0.85, summary:'The deal covers cloud migration, AI integration, and managed services over 7 years. TCS stock up 2.3% in early trade.' },
  { id:3, headline:'Infosys revises FY24 revenue guidance to 1.5–2% in constant currency amid macro headwinds', symbol:'INFY.NS', sector:'IT', sentiment:'bearish', source:'Mint', time:'15m ago', score:-0.62, summary:'Third consecutive guidance cut as demand slowness in BFSI and Hi-Tech verticals continues. Management says deal wins remain healthy.' },
  { id:4, headline:'HDFC Bank Q3 NIM stable at 4.1%; gross NPA improves to 1.26% — best in a decade', symbol:'HDFCBANK.NS', sector:'Banking', sentiment:'bullish', source:'Bloomberg Quint', time:'25m ago', score:0.71, summary:'Asset quality surprised positively. Credit growth at 16.8% YoY. Net profit ₹16,373 crore, up 33% YoY.' },
  { id:5, headline:'Nifty 50 opens flat; IT stocks lead gains while PSU banks drag the index', symbol:'^NSEI', sector:'Market', sentiment:'neutral', source:'MoneyControl', time:'30m ago', score:0.05, summary:'The broader market sentiment is cautious ahead of US Fed minutes. FIIs net sold ₹623 crore yesterday.' },
  { id:6, headline:'Bajaj Finance Q3 shows early signs of NPA stress in SME segment; analysts turn cautious', symbol:'BAJFINANCE.NS', sector:'Finance', sentiment:'bearish', source:'Reuters', time:'45m ago', score:-0.71, summary:'Gross NPA ticked up 15bps QoQ to 1.02%. Management attributed it to seasonal factors. Several brokerages cut target prices.' },
  { id:7, headline:'Titan jewellery revenue surges 25% in Q3 on festive demand; watches & wearables strong too', symbol:'TITAN.NS', sector:'Consumer', sentiment:'bullish', source:'CNBC-TV18', time:'1h ago', score:0.82, summary:'Tanishq division clocked record quarterly revenue. International business grew 31%. Company declared an interim dividend.' },
  { id:8, headline:'Crude oil hits 3-month high as OPEC+ signals production cut extension through Q2 2024', symbol:'ONGC.NS', sector:'Energy', sentiment:'bullish', source:'Reuters', time:'1h ago', score:0.55, summary:'Brent crude at $83.4/bbl. Positive for upstream oil companies. OMC margins may face pressure if retail prices held.' },
  { id:9, headline:'Wipro wins $300M AI transformation deal with European automotive giant', symbol:'WIPRO.NS', sector:'IT', sentiment:'bullish', source:'ET Markets', time:'2h ago', score:0.76, summary:'Multi-year engagement covers AI, cloud, and connected vehicle services. Deal announced alongside Q3 results.' },
  { id:10, headline:'RBI keeps repo rate unchanged at 6.5%; stance remains withdrawal of accommodation', symbol:'^NSEI', sector:'Market', sentiment:'neutral', source:'Hindu BusinessLine', time:'2h ago', score:0.02, summary:'MPC voted 5:1 to keep rates unchanged. Governor Das flagged food inflation risks. GDP forecast maintained at 7%.' },
  { id:11, headline:'Maruti Suzuki January domestic sales at 1,71,000 units — highest ever; SUVs up 34%', symbol:'MARUTI.NS', sector:'Auto', sentiment:'bullish', source:'Auto Today', time:'3h ago', score:0.88, summary:'Baleno, Brezza and Grand Vitara among top performers. CNG vehicles account for 27% of total sales. Exports also grew 18%.' },
  { id:12, headline:'FIIs turn net sellers; pull out ₹4,200 crore from Indian equities in the past week', symbol:'^NSEI', sector:'Market', sentiment:'bearish', source:'MoneyControl', time:'3h ago', score:-0.58, summary:'Dollar index strength and rising US yields driving FII outflows. DIIs absorbed selling. Midcap index outperforms largecap.' },
  { id:13, headline:'ICICI Bank Q3 net profit up 23% YoY to ₹10,272 crore; asset quality at decade-best levels', symbol:'ICICIBANK.NS', sector:'Banking', sentiment:'bullish', source:'Economic Times', time:'4h ago', score:0.91, summary:'GNPA at 2.3%, lowest since 2012. Retail loan growth strong at 22%. Net interest margin expanded 5bps to 4.43%.' },
  { id:14, headline:'Tata Steel faces headwinds from weak European demand; UK operations restructuring on cards', symbol:'TATASTEEL.NS', sector:'Metals', sentiment:'bearish', source:'Bloomberg', time:'4h ago', score:-0.48, summary:'Europe EBITDA losses widened in Q3. Management exploring options for UK business. India operations remain robust.' },
  { id:15, headline:'Sun Pharma gets USFDA approval for generic Revlimid; oncology pipeline strengthens', symbol:'SUNPHARMA.NS', sector:'Pharma', sentiment:'bullish', source:'Mint', time:'5h ago', score:0.69, summary:'Lenalidomide is a major blood cancer treatment. Limited competition market could add ₹800-1000 crore revenue annually.' },
];

const SENTIMENT_STYLE = {
  bullish: 'bg-emerald-500/15 text-emerald-400',
  bearish: 'bg-red-500/12 text-red-400',
  neutral: 'bg-white/[0.08] text-[#8b95a8]',
};

export default function News() {
  const navigate = useNavigate();
  const { setCurrentSymbol } = useStore();
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  const filtered = filter === 'ALL' ? NEWS : NEWS.filter(n => n.sentiment === filter.toLowerCase());

  const goToStock = (sym) => {
    setCurrentSymbol(sym);
    navigate('/chart');
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0e1a] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold">Market News</h1>
          <p className="text-[12px] text-[#5a6478] mt-1">Live financial news with AI sentiment analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot inline-block" />
          <span className="text-[12px] text-emerald-400">Live Feed</span>
        </div>
      </div>

      {/* Sentiment summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          ['Bullish', NEWS.filter(n=>n.sentiment==='bullish').length, 'text-emerald-400', 'bg-emerald-500/[0.07] border-emerald-500/20'],
          ['Neutral', NEWS.filter(n=>n.sentiment==='neutral').length, 'text-[#8b95a8]', 'bg-white/[0.03] border-white/[0.07]'],
          ['Bearish', NEWS.filter(n=>n.sentiment==='bearish').length, 'text-red-400', 'bg-red-500/[0.06] border-red-500/18'],
        ].map(([label,count,color,bg],i) => (
          <motion.div key={label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
            className={`border rounded-2xl p-4 ${bg}`}>
            <div className="text-[10px] text-[#5a6478] uppercase tracking-[0.6px] mb-2">{label} News</div>
            <div className={`text-[26px] font-semibold font-mono ${color}`}>{count}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['ALL','BULLISH','NEUTRAL','BEARISH'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-[6px] rounded-lg text-[12px] font-medium transition-all
              ${filter===f?'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30':'text-[#8b95a8] border border-white/[0.07] hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* News list */}
      <div className="flex flex-col gap-3">
        {filtered.map((item, i) => (
          <motion.div key={item.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
            className="bg-[#111827] border border-white/[0.07] rounded-2xl p-4 hover:border-white/15 transition-all cursor-pointer"
            onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-[2px] rounded-md text-[9px] font-bold uppercase tracking-[0.5px] ${SENTIMENT_STYLE[item.sentiment]}`}>
                    {item.sentiment}
                  </span>
                  <button onClick={e => { e.stopPropagation(); goToStock(item.symbol); }}
                    className="px-2 py-[2px] rounded-md text-[9px] bg-indigo-600/15 text-indigo-400 font-mono hover:bg-indigo-600/25 transition-all">
                    {item.symbol.replace('.NS','').replace('^','')}
                  </button>
                  <span className="text-[10px] text-[#5a6478]">{item.sector}</span>
                </div>
                <p className="text-[13px] text-white leading-[1.5] mb-2">{item.headline}</p>
                {expanded === item.id && (
                  <motion.p initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}}
                    className="text-[12px] text-[#8b95a8] leading-[1.6] mt-2 pt-2 border-t border-white/[0.06]">
                    {item.summary}
                  </motion.p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[10px] text-[#5a6478]">{item.source}</div>
                <div className="text-[10px] text-[#5a6478] mt-1">{item.time}</div>
                <div className={`font-mono text-[12px] font-semibold mt-2 ${item.score>0?'text-emerald-400':item.score<0?'text-red-400':'text-[#8b95a8]'}`}>
                  {item.score>0?'+':''}{item.score.toFixed(2)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
