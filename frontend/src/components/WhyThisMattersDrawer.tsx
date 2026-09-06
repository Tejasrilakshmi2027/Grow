import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Zap, ArrowUpRight, ArrowDownRight, Activity, CheckCircle2, BarChart2, Info } from 'lucide-react';
import { StockAttentionCard } from '../types';
import { DataModeBadge } from './DataModeBadge';
import { AttentionBadge } from './AttentionBadge';
import { Link } from 'react-router-dom';

interface WhyThisMattersDrawerProps {
  card: StockAttentionCard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WhyThisMattersDrawer: React.FC<WhyThisMattersDrawerProps> = ({
  card,
  isOpen,
  onClose
}) => {
  if (!card) return null;

  const isPositive = card.quote.change_percent >= 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Sliding Right Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-[#0D1322] border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              
              {/* Drawer Content */}
              <div className="p-6 space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">{card.symbol}</h2>
                    <AttentionBadge severity={card.severity} score={card.attention_score} />
                  </div>

                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub-header / Data Mode */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">{card.instrument_name}</span>
                  <DataModeBadge mode={card.quote.data_mode} source={card.quote.freshness.source} />
                </div>

                {/* Price & Primary Delta Metric */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Current Quote</span>
                    <p className="text-2xl font-extrabold text-white font-mono mt-0.5">
                      ₹{card.quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className={`text-right font-mono font-bold text-base ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      {isPositive ? '+' : ''}{card.quote.change_percent.toFixed(2)}%
                    </div>
                    <span className="text-xs text-slate-500 font-normal">
                      Since Checkpoint
                    </span>
                  </div>
                </div>

                {/* What Changed Metric Box */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    What Changed Since Last Check
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Volume Anomaly</span>
                      <p className="text-base font-bold text-white font-mono mt-0.5">{card.quote.volume_ratio.toFixed(1)}x</p>
                      <p className="text-[10px] text-slate-400">vs 20D Moving Avg</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Relative Outperformance</span>
                      <p className={`text-base font-bold font-mono mt-0.5 ${
                        card.quote.relative_outperformance != null
                          ? (card.quote.relative_outperformance >= 0 ? 'text-emerald-400' : 'text-red-400')
                          : 'text-slate-400'
                      }`}>
                        {card.quote.relative_outperformance != null
                          ? `${card.quote.relative_outperformance >= 0 ? '+' : ''}${card.quote.relative_outperformance.toFixed(2)}%`
                          : 'Unavailable'}
                      </p>
                      <p className="text-[10px] text-slate-400">vs Benchmark</p>
                    </div>
                  </div>
                </div>

                {/* Transparent 7-Signal Contribution Matrix */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-indigo-400" />
                      Signal Score Decomposition
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      Confidence: {(card.explanation.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="space-y-2.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                    {card.explanation.signals.map((sig) => (
                      <div key={sig.code} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                            {sig.name}
                          </span>
                          <span className="font-mono font-bold text-indigo-400">
                            +{sig.contribution.toFixed(1)} pts
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 pl-5">{sig.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation Summary */}
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
                  <div className="font-bold mb-1 text-indigo-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Deterministic Explanation
                  </div>
                  {card.explanation.summary}
                </div>

              </div>

              {/* Drawer Footer CTA */}
              <div className="p-6 border-t border-slate-800 bg-slate-950/80 flex items-center gap-3">
                <Link
                  to={`/stocks/${card.symbol}`}
                  onClick={onClose}
                  className="flex-1 py-3 text-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
                >
                  View Full Stock Analytics →
                </Link>
              </div>

            </motion.div>
          </div>

        </div>
      )}
    </AnimatePresence>
  );
};
