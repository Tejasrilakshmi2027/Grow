import React from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Cpu } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  const signals = [
    { name: 'Price Movement Impact', weight: '25%', code: 'PRICE_MOVE', desc: 'Absolute % move relative to last close baseline.' },
    { name: 'Volume Anomaly', weight: '20%', code: 'VOLUME_ANOMALY', desc: 'Ratio of current daily volume relative to 20-day moving average volume.' },
    { name: 'Volatility Shift', weight: '15%', code: 'VOLATILITY_SHIFT', desc: '20-day annualized volatility from daily log returns vs 15% baseline.' },
    { name: 'Market-Relative Outperformance', weight: '15%', code: 'MARKET_RELATIVE', desc: 'Excess return or divergence compared against market benchmark index.' },
    { name: 'Corporate & Earnings Events', weight: '15%', code: 'CORPORATE_EVENT', desc: 'Filings, dividend announcements, or earnings surprises.' },
    { name: 'News & Sentiment Spike', weight: '5%', code: 'NEWS_SIGNAL', desc: 'Verified market news volume or headline sentiment anomaly.' },
    { name: 'Signal Recency Decay', weight: '5%', code: 'RECENCY', desc: 'Time elapsed since user last checked session baseline.' },
  ];

  return (
    <div className="min-h-screen bg-[#090D16] pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">System & Scoring Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            PulseWatch scoring architecture, deterministic weights, and user session configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 7-Signal Scoring Weights Matrix (2 cols) */}
          <div className="lg:col-span-2 bg-[#0D1322] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">7-Signal Deterministic Engine Configuration</h3>
                <p className="text-xs text-slate-400">Configured weights used to compute 0-100 Attention Scores.</p>
              </div>
            </div>

            <div className="space-y-4">
              {signals.map((sig) => (
                <div key={sig.code} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{sig.name}</span>
                      <span className="text-[10px] font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                        {sig.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{sig.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-sm font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 self-start sm:self-auto">
                    Weight {sig.weight}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Profile & SLA Limits (1 col) */}
          <div className="space-y-6">
            
            {/* User Info */}
            <div className="bg-[#0D1322] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">User Account Profile</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500">Full Name:</span>
                  <p className="font-semibold text-white text-sm">{user?.name || 'Aarav Sharma'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Email Address:</span>
                  <p className="font-semibold text-white text-sm">{user?.email || 'demo@pulsewatch.app'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Engine Tier:</span>
                  <p className="font-semibold text-indigo-400">PulseWatch Pro (Full Access)</p>
                </div>
              </div>
            </div>

            {/* Freshness SLA */}
            <div className="bg-[#0D1322] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Data Freshness SLA</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <span className="font-bold text-emerald-400">FRESH</span>
                  <span className="text-slate-300 font-mono">&lt; 60 seconds</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <span className="font-bold text-amber-400">AGING</span>
                  <span className="text-slate-300 font-mono">60 - 300 seconds</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                  <span className="font-bold text-red-400">STALE</span>
                  <span className="text-slate-300 font-mono">&gt; 300 seconds</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
};
