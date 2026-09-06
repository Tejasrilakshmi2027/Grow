import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AttentionBadgeProps {
  score: number;
  severity: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AttentionBadge: React.FC<AttentionBadgeProps> = ({
  score,
  severity,
  showScore = true,
  size = 'md'
}) => {
  const getBadgeStyle = () => {
    switch (severity) {
      case 'HIGH':
        return {
          bg: 'bg-red-500/10 text-red-400 border-red-500/30',
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          label: 'HIGH ATTENTION'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          label: 'MEDIUM ATTENTION'
        };
      case 'LOW':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: <Info className="w-3.5 h-3.5" />,
          label: 'LOW ATTENTION'
        };
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          label: 'NORMAL'
        };
    }
  };

  const style = getBadgeStyle();
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1';

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${style.bg} ${sizeClasses}`}>
        {style.icon}
        {style.label}
      </span>
      {showScore && (
        <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
          Score <span className="font-bold text-white">{Math.round(score)}</span>/100
        </span>
      )}
    </div>
  );
};
