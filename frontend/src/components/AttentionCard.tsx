import React from 'react';
import { motion } from 'framer-motion';
import { StockAttentionCard } from '../types';
import { AttentionBadge } from './AttentionBadge';
import { DataModeBadge } from './DataModeBadge';
import { ArrowUpRight, ArrowDownRight, Activity, Info, ChevronRight, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AttentionCardProps {
  data: StockAttentionCard;
  onWhyThisMatters: (card: StockAttentionCard) => void;
}

export const AttentionCard: React.FC<AttentionCardProps> = ({ data, onWhyThisMatters }) => {
  const isPositive = data.quote.change_percent >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
      className="bg-[#0D1322] border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 group"
    >
      {/* Top Bar: Symbol & Badges */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link to={`/stocks/${data.symbol}`} className="font-extrabold text-xl text-white group-hover:text-indigo-400 transition-colors">
              {data.symbol}
            </Link>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {data.exchange}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{data.instrument_name}</p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <AttentionBadge severity={data.severity} score={data.attention_score} />
          <DataModeBadge mode={data.quote.data_mode} />
        </div>
      </div>

      {/* Quote & Percentage Movement */}
      <div className="flex items-baseline justify-between py-2 border-y border-slate-800/80">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500">Current Quote</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-0.5">
            ₹{data.quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="text-right font-mono font-bold">
          <div className={`flex items-center justify-end gap-1 text-base ${
            isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            {isPositive ? '+' : ''}{data.quote.change_percent.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-500 font-normal">
            ₹{data.quote.change_absolute >= 0 ? '+' : ''}{data.quote.change_absolute.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Key Signal Snapshot Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Volume</span>
          <p className="text-sm font-bold text-white mt-0.5">{data.quote.volume_ratio.toFixed(1)}x normal</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase font-bold">vs Benchmark</span>
          <p className={`text-sm font-bold mt-0.5 ${
            data.quote.relative_outperformance != null
              ? (data.quote.relative_outperformance >= 0 ? 'text-emerald-400' : 'text-red-400')
              : 'text-slate-400'
          }`}>
            {data.quote.relative_outperformance != null
              ? `${data.quote.relative_outperformance >= 0 ? '+' : ''}${data.quote.relative_outperformance.toFixed(2)}%`
              : 'Unavailable'}
          </p>
        </div>
      </div>

      {/* Explanation Summary */}
      <div className="text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
        <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">Signal Reasoning</span>
        <p className="line-clamp-2">{data.explanation.summary}</p>
      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => onWhyThisMatters(data)}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group/btn"
        >
          Why this matters
          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>

        <Link
          to={`/stocks/${data.symbol}`}
          className="text-xs font-semibold text-slate-400 hover:text-white"
        >
          View details →
        </Link>
      </div>

    </motion.div>
  );
};
