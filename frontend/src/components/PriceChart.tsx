import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartPoint } from '../types';

interface PriceChartProps {
  data: ChartPoint[];
  symbol: string;
  selectedRange: string;
  onRangeChange: (range: string) => void;
  isPositive?: boolean;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  data,
  symbol,
  selectedRange,
  onRangeChange,
  isPositive = true
}) => {
  const ranges = ['1D', '1W', '1M', '3M', '1Y'];

  const formattedData = data.map((pt) => ({
    time: new Date(pt.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    price: pt.price,
    volume: pt.volume
  }));

  const minPrice = data.length > 0 ? Math.min(...data.map(d => d.price)) * 0.995 : 0;
  const maxPrice = data.length > 0 ? Math.max(...data.map(d => d.price)) * 1.005 : 100;

  const strokeColor = isPositive ? '#10B981' : '#EF4444';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
      
      {/* Time Range Filter Buttons */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <h3 className="text-sm font-bold text-slate-300 tracking-wide uppercase">Historical Price Trend</h3>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedRange === r
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            Loading price chart data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`colorPrice-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis domain={[minPrice, maxPrice]} stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val.toFixed(0)}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
                formatter={(value: number | string) => [`₹${Number(value).toFixed(2)}`, 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#colorPrice-${symbol})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
