import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, ArrowUpRight, ArrowDownRight, Activity, Clock, 
  ShieldCheck, BarChart2, Zap, RefreshCw, AlertCircle, Info, CheckCircle2 
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { AttentionBadge } from '../components/AttentionBadge';
import { PriceChart } from '../components/PriceChart';
import { ChangeTimeline } from '../components/ChangeTimeline';
import { StockQuote, ChartPoint, ChangeEventOut, SignalContribution } from '../types';
import { api } from '../api/client';

export const StockDetailPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [history, setHistory] = useState<ChartPoint[]>([]);
  const [events, setEvents] = useState<ChangeEventOut[]>([]);
  const [selectedRange, setSelectedRange] = useState('1M');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStockData = async (sym: string, range = selectedRange) => {
    setLoading(true);
    setError(null);
    try {
      const [q, h, evts] = await Promise.all([
        api.getStockQuote(sym),
        api.getStockHistory(sym, range),
        api.getStockEvents(sym)
      ]);
      setQuote(q);
      setHistory(h);
      setEvents(evts);
    } catch (err: unknown) {
      setError((err as Error).message || `Failed to fetch detailed data for ${sym}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      loadStockData(symbol, selectedRange);
    }
  }, [symbol]);

  const handleRangeChange = async (newRange: string) => {
    setSelectedRange(newRange);
    if (symbol) {
      try {
        const h = await api.getStockHistory(symbol, newRange);
        setHistory(h);
      } catch (err) {
        console.error("Failed to load historical range:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading stock analytical snapshot...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-[#090D16]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Stock Information Unavailable</h2>
          <p className="text-xs text-slate-400">{error || 'Instrument data could not be retrieved.'}</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = quote.change_percent >= 0;

  return (
    <div className="min-h-screen bg-[#090D16] pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Back Link */}
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Smart Watchlist
          </Link>
        </div>

        {/* Stock Header Banner */}
        <div className="bg-[#0D1322] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{quote.symbol}</h1>
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {quote.exchange}
              </span>
            </div>
            <p className="text-sm text-slate-400">{quote.name}</p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div>
              <div className="text-3xl font-extrabold text-white font-mono">
                ₹{quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className={`flex items-center gap-1 font-bold text-sm font-mono mt-1 ${
                isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {isPositive ? '+' : ''}{quote.change_percent.toFixed(2)}% (₹{quote.change_absolute.toFixed(2)})
              </div>
            </div>

            {/* Freshness Badge */}
            <div className="pl-4 border-l border-slate-800 flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Data Freshness</span>
              <span className={`inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded mt-1 ${
                quote.freshness.status === 'fresh'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                <Clock className="w-3 h-3" />
                {quote.freshness.status.toUpperCase()} ({quote.freshness.age_seconds != null ? `${Math.round(quote.freshness.age_seconds)}s ago` : 'Real-time'})
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid: Price Chart & Key Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Price Chart (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <PriceChart
              data={history}
              symbol={quote.symbol}
              selectedRange={selectedRange}
              onRangeChange={handleRangeChange}
              isPositive={isPositive}
            />

            {/* Key Technical & Fundamental Metrics */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-300 tracking-wide uppercase">Market Signal Statistics</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Volume Multiple</span>
                  <p className="text-lg font-bold text-white font-mono mt-0.5">{quote.volume_ratio}x</p>
                  <p className="text-[10px] text-slate-400">vs 20-Day Average</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Day High / Low</span>
                  <p className="text-xs font-bold text-white font-mono mt-1">₹{quote.high} / ₹{quote.low}</p>
                  <p className="text-[10px] text-slate-400">Trading Range</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Relative Outperformance</span>
                  <p className={`text-lg font-bold font-mono mt-0.5 ${
                    quote.relative_outperformance != null
                      ? (quote.relative_outperformance >= 0 ? 'text-emerald-400' : 'text-red-400')
                      : 'text-slate-400'
                  }`}>
                    {quote.relative_outperformance != null
                      ? `${quote.relative_outperformance >= 0 ? '+' : ''}${quote.relative_outperformance.toFixed(2)}%`
                      : 'Unavailable'}
                  </p>
                  <p className="text-[10px] text-slate-400">vs Benchmark</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Trading Volume</span>
                  <p className="text-sm font-bold text-white font-mono mt-1">
                    {(quote.volume / 100000).toFixed(2)} Lakhs
                  </p>
                  <p className="text-[10px] text-slate-400">Shares Traded</p>
                </div>
              </div>
            </div>
          </div>

          {/* Persisted Event Log & Timeline (1 col) */}
          <div className="space-y-6">
            <div className="bg-[#0D1322] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Since You Last Checked
                </h3>
              </div>

              <ChangeTimeline events={events} />
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
