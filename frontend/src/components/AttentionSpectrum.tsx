import React from 'react';
import { motion } from 'framer-motion';
import { StockAttentionCard } from '../types';
import { Sparkles, Eye, Info } from 'lucide-react';

interface AttentionSpectrumProps {
  cards: StockAttentionCard[];
  onSelectStock: (card: StockAttentionCard) => void;
}

export const AttentionSpectrum: React.FC<AttentionSpectrumProps> = ({ cards, onSelectStock }) => {
  // Sort cards by attention score ascending for linear placement along the spectrum
  const sorted = [...cards].sort((a, b) => a.attention_score - b.attention_score);

  const getSeverityColor = (score: number) => {
    if (score >= 71) return { bg: 'bg-red-500', border: 'border-red-500', glow: 'shadow-red-500/40', text: 'text-red-400' };
    if (score >= 46) return { bg: 'bg-amber-500', border: 'border-amber-500', glow: 'shadow-amber-500/40', text: 'text-amber-400' };
    if (score >= 21) return { bg: 'bg-blue-500', border: 'border-blue-500', glow: 'shadow-blue-500/30', text: 'text-blue-400' };
    return { bg: 'bg-slate-500', border: 'border-slate-600', glow: 'shadow-slate-500/20', text: 'text-slate-400' };
  };

  return (
    <div className="bg-[#0D1322] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">Attention Spectrum Radar</h3>
            <p className="text-xs text-slate-400">Visual relative positioning of watched stocks based on calculated 0–100 score.</p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
          {cards.length} Instruments Positioned
        </span>
      </div>

      {/* Spectrum Axis Line */}
      <div className="relative pt-8 pb-12 px-4">
        
        {/* Continuous Gradient Line */}
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-slate-700 via-blue-500 via-amber-500 to-red-500 opacity-60 shadow-inner" />

        {/* Level Ticks */}
        <div className="flex justify-between text-[11px] font-bold font-mono uppercase text-slate-400 pt-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block"/> Normal (0–20)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/> Low (21–45)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"/> Medium (46–70)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/> High (71–100)</span>
        </div>

        {/* Positioned Stock Nodes */}
        <div className="absolute inset-x-4 top-4 h-10 pointer-events-none">
          {sorted.map((item, idx) => {
            // Compute percentage offset along line (0 to 100%)
            const leftPct = Math.min(95, Math.max(5, item.attention_score));
            const colors = getSeverityColor(item.attention_score);

            return (
              <motion.div
                key={item.symbol}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                style={{ left: `${leftPct}%` }}
                className="absolute top-0 -translate-x-1/2 pointer-events-auto group cursor-pointer"
                onClick={() => onSelectStock(item)}
              >
                {/* Node Pill */}
                <div className={`px-3 py-1.5 rounded-full bg-slate-900 border ${colors.border} shadow-lg ${colors.glow} flex items-center gap-1.5 hover:scale-110 transition-transform`}>
                  <span className={`w-2 h-2 rounded-full ${colors.bg} animate-pulse`} />
                  <span className="text-xs font-bold text-white font-mono">{item.symbol}</span>
                  <span className={`text-[10px] font-extrabold font-mono ${colors.text}`}>
                    {item.attention_score}
                  </span>
                </div>

                {/* Hover Tooltip Card */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-3 left-1/2 -translate-x-1/2 pointer-events-none z-30 w-56 p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{item.symbol}</span>
                    <span className={colors.text}>{item.severity} ATTENTION</span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    ₹{item.quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({item.quote.change_percent >= 0 ? '+' : ''}{item.quote.change_percent.toFixed(2)}%)
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {item.explanation.summary}
                  </p>
                  <div className="text-[9px] text-indigo-400 font-semibold pt-1 border-t border-slate-800 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Click to inspect signal breakdown
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
