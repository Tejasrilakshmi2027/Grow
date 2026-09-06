import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { InstrumentSearch } from '../types';
import { api } from '../api/client';

interface StockSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStock: (symbol: string, name: string, exchange: string) => Promise<void>;
  existingSymbols: string[];
}

export const StockSearchModal: React.FC<StockSearchModalProps> = ({
  isOpen,
  onClose,
  onAddStock,
  existingSymbols
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InstrumentSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      // Default top suggestions
      setResults([
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE', sector: 'Energy & Conglomerate' },
        { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', sector: 'Information Technology' },
        { symbol: 'INFY', name: 'Infosys Limited', exchange: 'NSE', sector: 'Information Technology' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', exchange: 'NSE', sector: 'Financial Services' },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', exchange: 'NSE', sector: 'Financial Services' },
        { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', exchange: 'NSE', sector: 'Automotive' },
        { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Consumer Electronics' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Semiconductors' },
      ]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await api.searchStocks(query);
        setResults(data);
      } catch (err: unknown) {
        setErrorMsg((err as Error).message || 'Failed to search stock instruments.');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleAdd = async (inst: InstrumentSearch) => {
    setAddingSymbol(inst.symbol);
    setErrorMsg(null);
    try {
      await onAddStock(inst.symbol, inst.name, inst.exchange);
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Error adding stock to watchlist.');
    } finally {
      setAddingSymbol(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0D1322] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white tracking-tight">Add Stock to Watchlist</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="py-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by symbol or company name (e.g. RELIANCE, TCS)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            {loading && (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin absolute right-3.5 top-3.5" />
            )}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {results.length === 0 && !loading ? (
            <p className="text-center text-sm text-slate-500 py-8">No matching instruments found.</p>
          ) : (
            results.map((inst) => {
              const isAlreadyAdded = existingSymbols.includes(inst.symbol.toUpperCase());
              const isAdding = addingSymbol === inst.symbol;

              return (
                <div
                  key={inst.symbol}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/60 border border-slate-800/80 transition-colors group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{inst.symbol}</span>
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {inst.exchange}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{inst.name}</p>
                    <p className="text-[10px] text-slate-500">{inst.sector}</p>
                  </div>

                  <button
                    onClick={() => handleAdd(inst)}
                    disabled={isAlreadyAdded || isAdding}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isAlreadyAdded
                        ? 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                    }`}
                  >
                    {isAdding ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isAlreadyAdded ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Add Stock
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
