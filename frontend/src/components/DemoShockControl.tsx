import React, { useState } from 'react';
import { Zap, Activity, Check, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

interface DemoShockControlProps {
  onShockTriggered: () => void;
}

export const DemoShockControl: React.FC<DemoShockControlProps> = ({ onShockTriggered }) => {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [priceMove, setPriceMove] = useState(4.82);
  const [volMult, setVolMult] = useState(2.8);
  const [headline, setHeadline] = useState('Unusual Surge: +4.82% surge with 2.8x volume anomaly');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const presets = [
    { label: 'RELIANCE +4.8% Surge (2.8x Vol)', symbol: 'RELIANCE', move: 4.82, vol: 2.8, headline: 'Quarterly Earnings Beat (+14% YoY Net Profit)' },
    { label: 'TATAMOTORS +6.2% Surge (3.1x Vol)', symbol: 'TATAMOTORS', move: 6.20, vol: 3.1, headline: 'JLR Volume Jump +18% (3.1x Volume Surge)' },
    { label: 'TCS -3.5% Drop (2.1x Vol)', symbol: 'TCS', move: -3.50, vol: 2.1, headline: 'Unusual Trading Outflow Detected' },
  ];

  const handleTrigger = async (sym = symbol, pMove = priceMove, vMult = volMult, head = headline) => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      await api.triggerDemoShock(sym, pMove, vMult, head);
      setSuccessMsg(`Simulated live market shock on ${sym}! Dashboard updated.`);
      onShockTriggered();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error("Demo shock error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">Live Evaluator Demo Controller</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                JUDGE SIMULATOR
              </span>
            </div>
            <p className="text-xs text-slate-400">Simulate market moves & see PulseWatch "Since You Last Checked" engine rank changes in real-time.</p>
          </div>
        </div>

        {/* Preset Shock Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleTrigger(p.symbol, p.move, p.vol, p.headline)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500/50 text-xs font-semibold text-slate-200 hover:text-white transition-all disabled:opacity-50"
            >
              ⚡ {p.label}
            </button>
          ))}
        </div>
      </div>

      {successMsg && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
