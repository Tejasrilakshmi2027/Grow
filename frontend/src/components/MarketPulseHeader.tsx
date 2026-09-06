import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { DataModeBadge } from './DataModeBadge';
import { api } from '../api/client';
import { MarketIndex } from '../types';

interface MarketPulseHeaderProps {
  dataMode?: string;
  lastUpdatedText?: string;
}

export const MarketPulseHeader: React.FC<MarketPulseHeaderProps> = ({
  dataMode = 'demo',
  lastUpdatedText = 'Updated 12s ago'
}) => {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchIndices = async () => {
      try {
        const data = await api.getMarketIndices();
        if (isMounted) {
          setIndices(data);
        }
      } catch (err) {
        console.error("Failed to fetch market indices:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchIndices();
    const interval = setInterval(fetchIndices, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const effectiveMode = indices.length > 0 && indices.every(i => i.data_mode === 'live') ? 'live' : dataMode;

  return (
    <div className="bg-[#090D16]/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-20 py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Indices Strip */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-2 flex-shrink-0 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            Market Pulse
          </div>

          <div className="h-4 w-px bg-slate-800 flex-shrink-0 hidden sm:block" />

          <div className="flex items-center gap-6 flex-shrink-0">
            {loading ? (
              <span className="text-xs font-mono text-slate-500">Loading index data...</span>
            ) : indices.length === 0 ? (
              <span className="text-xs font-mono text-slate-500">Index data unavailable</span>
            ) : (
              indices.map((idx) => {
                if (!idx.is_available || idx.price === null || idx.price === undefined) {
                  return (
                    <div key={idx.symbol} className="flex items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-slate-300">{idx.symbol}</span>
                      <span className="text-slate-500 italic">Index data unavailable</span>
                    </div>
                  );
                }

                const changePct = idx.change_percent ?? 0;
                const isPos = changePct >= 0;
                return (
                  <div key={idx.symbol} className="flex items-center gap-2 text-xs font-mono">
                    <span className="font-bold text-slate-300">
                      {idx.symbol}
                      {idx.data_mode === 'demo' && <span className="ml-1 text-[9px] text-indigo-400 font-sans font-semibold">[DEMO]</span>}
                    </span>
                    <span className="text-slate-400">
                      ₹{idx.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`flex items-center font-bold px-1.5 py-0.5 rounded text-[11px] ${
                      isPos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {isPos ? '+' : ''}{changePct.toFixed(2)}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Global Freshness & Mode */}
        <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
          <DataModeBadge mode={effectiveMode} source={lastUpdatedText} />
        </div>

      </div>
    </div>
  );
};
