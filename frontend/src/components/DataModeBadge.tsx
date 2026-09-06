import React from 'react';
import { Clock, ShieldAlert, Zap, CheckCircle2 } from 'lucide-react';

interface DataModeBadgeProps {
  mode?: string; // 'live' | 'demo'
  status?: string; // 'fresh' | 'aging' | 'stale'
  ageSeconds?: number;
  source?: string;
  className?: string;
}

export const DataModeBadge: React.FC<DataModeBadgeProps> = ({
  mode = 'demo',
  status = 'fresh',
  ageSeconds = 0,
  source,
  className = ''
}) => {
  const isLive = mode.toLowerCase() === 'live';

  if (isLive) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide border ${
        status === 'stale'
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
      } ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="uppercase">LIVE</span>
        <span className="text-slate-400 font-normal">
          • {source ? source : (ageSeconds > 0 ? `${Math.round(ageSeconds)}s ago` : 'Real-Time')}
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-sm ${className}`}>
      <Zap className="w-3 h-3 text-indigo-400 fill-indigo-400/20" />
      <span className="uppercase">DEMO / SIMULATION</span>
      {source && <span className="text-slate-400 font-normal">• {source}</span>}
    </div>
  );
};
