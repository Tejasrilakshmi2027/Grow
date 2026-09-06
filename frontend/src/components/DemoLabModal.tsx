import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Play, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';

interface DemoLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShockTriggered: () => void;
}

export const DemoLabModal: React.FC<DemoLabModalProps> = ({
  isOpen,
  onClose,
  onShockTriggered
}) => {
  const [loadingSymbol, setLoadingSymbol] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      symbol: 'RELIANCE',
      title: 'RELIANCE +5.2% Earnings Surprise Surge',
      desc: 'Simulates a major bullish price breakout accompanied by 3.0x volume anomaly.',
      priceChangePct: 5.2,
      volumeMult: 3.0,
      headline: 'Reliance Retail & Energy Q2 EBITDA Beats Consensus by 18%'
    },
    {
      symbol: 'TATAMOTORS',
      title: 'TATAMOTORS +4.8% Volume Anomaly Jump',
      desc: 'Simulates a heavy institutional volume spike (3.1x) following JLR export update.',
      priceChangePct: 4.8,
      volumeMult: 3.1,
      headline: 'JLR Global Deliveries Expand 18% YoY in Q2'
    },
    {
      symbol: 'TCS',
      title: 'TCS -3.2% Tech Sector Divergence',
      desc: 'Simulates negative relative price move while broader NIFTY remains positive.',
      priceChangePct: -3.2,
      volumeMult: 1.8,
      headline: 'IT Sector Spending Cut Surprises European Market Operations'
    }
  ];

  const handleTrigger = async (sc: typeof scenarios[0]) => {
    setLoadingSymbol(sc.symbol);
    setSuccessMsg(null);
    try {
      await api.triggerDemoShock(sc.symbol, sc.priceChangePct, sc.volumeMult, sc.headline);
      setSuccessMsg(`Simulated scenario injected for ${sc.symbol}! Attention scores updated.`);
      onShockTriggered();
    } catch (err: unknown) {
      console.error("Failed to inject demo shock:", err);
    } finally {
      setLoadingSymbol(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#0D1322] border border-indigo-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative overflow-hidden"
        >
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Zap className="w-5 h-5 fill-indigo-400/20" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  PulseWatch Demo Lab / Judge Simulator
                </h3>
                <p className="text-xs text-slate-400">
                  Deterministic simulation engine for hackathon evaluation.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Simulation Notice */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Judge Evaluator Note:</span>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Simulated shocks process through the exact same production <code>ChangeDetectionService</code> as live provider data, recalculating scores deterministically.
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Scenario Selection Grid */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Market Scenario to Inject</span>
            
            {scenarios.map((sc) => (
              <div
                key={sc.symbol}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-colors flex items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{sc.symbol}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {sc.priceChangePct >= 0 ? '+' : ''}{sc.priceChangePct}% Price | {sc.volumeMult}x Vol
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{sc.title}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{sc.desc}</p>
                </div>

                <button
                  onClick={() => handleTrigger(sc)}
                  disabled={loadingSymbol === sc.symbol}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all flex-shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {loadingSymbol === sc.symbol ? 'Injecting...' : 'Inject Shock'}
                </button>
              </div>
            ))}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
