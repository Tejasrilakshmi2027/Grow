import React from 'react';
import { Clock, TrendingUp, Volume2, AlertCircle, FileText, Zap } from 'lucide-react';
import { ChangeEventOut } from '../types';

interface ChangeTimelineProps {
  events: ChangeEventOut[];
  sinceLastCheckedText?: string;
}

export const ChangeTimeline: React.FC<ChangeTimelineProps> = ({ events, sinceLastCheckedText }) => {
  const getEventIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PRICE_SPIKE':
      case 'OUTPERFORMANCE':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      case 'VOLUME_SPIKE':
      case 'VOLUME_ANOMALY':
        return <Volume2 className="w-3.5 h-3.5 text-amber-400" />;
      case 'CORPORATE_EVENT':
      case 'EARNINGS_SURGE':
        return <FileText className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Zap className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const dt = new Date(dateStr);
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {sinceLastCheckedText && (
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 pb-2 border-b border-slate-800">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Checkpoint: {sinceLastCheckedText}</span>
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-2">No event logs recorded since your session baseline.</p>
      ) : (
        <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {events.map((evt) => (
            <div key={evt.id} className="relative flex items-start gap-3 text-xs">
              {/* Event node dot */}
              <div className="absolute -left-4 top-0.5 w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                {getEventIcon(evt.event_type)}
              </div>
              <div className="flex-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-semibold text-slate-200">{evt.headline}</span>
                  <span className="font-mono text-[10px] text-slate-500">{formatDate(evt.occurred_at)}</span>
                </div>
                {evt.payload && (
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mt-1">
                    {evt.payload.price_move && (
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded">
                        Move: <strong className="text-white">{evt.payload.price_move > 0 ? '+' : ''}{evt.payload.price_move}%</strong>
                      </span>
                    )}
                    {evt.payload.volume_ratio && (
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded">
                        Volume: <strong className="text-white">{evt.payload.volume_ratio}x</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
