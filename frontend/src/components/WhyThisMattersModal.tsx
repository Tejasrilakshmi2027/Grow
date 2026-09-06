import React from 'react';
import { X, ShieldCheck, TrendingUp, BarChart2, Zap, Award, CheckCircle2 } from 'lucide-react';
import { StockAttentionCard } from '../types';
import { AttentionBadge } from './AttentionBadge';

interface WhyThisMattersModalProps {
  card: StockAttentionCard | null;
  onClose: () => void;
}

export const WhyThisMattersModal: React.FC<WhyThisMattersModalProps> = ({ card, onClose }) => {
  if (!card) return null;

  const { symbol, instrument_name, quote, attention_score, severity, explanation } = card;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#0D1322] border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-white tracking-tight">{symbol}</h2>
              <AttentionBadge score={attention_score} severity={severity} />
            </div>
            <p className="text-sm text-slate-400">{instrument_name} • {quote.exchange}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="py-5 overflow-y-auto space-y-6 flex-1 pr-1">
          
          {/* Executive Explanation Box */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between text-indigo-400 font-semibold text-sm">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                Executive Summary
              </span>
              <span className="flex items-center gap-1 text-xs bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300 border border-indigo-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Confidence {(explanation.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed font-medium">
              {explanation.summary}
            </p>
          </div>

          {/* Key Detected Signal Bullets */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Key Detected Signals</h4>
            <div className="space-y-2">
              {explanation.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-200">{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signal Score Breakdown Matrix */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Signal Weight & Score Contribution Matrix
            </h4>
            <div className="space-y-3">
              {explanation.signals.map((sig) => {
                const percent = Math.min(100, Math.max(0, (sig.contribution / (100 * sig.weight)) * 100));
                return (
                  <div key={sig.code} className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-200">{sig.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono">Weight: {(sig.weight * 100).toFixed(0)}%</span>
                        <span className="font-bold text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                          +{sig.contribution.toFixed(1)} pts
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sig.contribution > 15 ? 'bg-red-500' : sig.contribution > 8 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">{sig.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Neutral Financial Disclaimer */}
          <div className="pt-2 text-[11px] text-slate-500 text-center border-t border-slate-800">
            Market information and attention scores are computed for informational purposes and do not constitute financial or investment advice.
          </div>

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
