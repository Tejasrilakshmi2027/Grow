import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { StockSearchModal } from '../components/StockSearchModal';
import { Watchlist, WatchlistItem } from '../types';
import { api } from '../api/client';
import { Plus, Trash2, Edit2, Check, X, Search, ListFilter, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WatchlistsPage: React.FC = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [isCreatingWl, setIsCreatingWl] = useState(false);
  const [editingWlId, setEditingWlId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadWatchlists = async () => {
    setLoading(true);
    try {
      const data = await api.getWatchlists();
      setWatchlists(data);
      if (data.length > 0 && !selectedWatchlistId) {
        setSelectedWatchlistId(data[0].id);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load watchlists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlists();
  }, []);

  const currentWatchlist = watchlists.find(w => w.id === selectedWatchlistId) || watchlists[0];

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;
    setError(null);
    try {
      const created = await api.createWatchlist(newWatchlistName.trim());
      setWatchlists([...watchlists, created]);
      setSelectedWatchlistId(created.id);
      setNewWatchlistName('');
      setIsCreatingWl(false);
    } catch (err: unknown) {
      setError((err as Error).message || 'Error creating watchlist.');
    }
  };

  const handleDeleteWatchlist = async (id: string) => {
    if (watchlists.length <= 1) {
      setError('You must keep at least one active watchlist.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this watchlist?')) return;
    setError(null);
    try {
      await api.deleteWatchlist(id);
      const remaining = watchlists.filter(w => w.id !== id);
      setWatchlists(remaining);
      setSelectedWatchlistId(remaining[0]?.id);
    } catch (err: unknown) {
      setError((err as Error).message || 'Error deleting watchlist.');
    }
  };

  const handleAddStock = async (symbol: string, name: string, exchange: string) => {
    if (!currentWatchlist) return;
    await api.addWatchlistItem(currentWatchlist.id, symbol, name, exchange);
    await loadWatchlists();
  };

  const handleRemoveStock = async (itemId: string) => {
    if (!currentWatchlist) return;
    try {
      await api.removeWatchlistItem(currentWatchlist.id, itemId);
      await loadWatchlists();
    } catch (err: unknown) {
      setError((err as Error).message || 'Error removing stock item.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] pb-16">
      <Navbar
        watchlists={watchlists}
        activeWatchlistId={selectedWatchlistId}
        onSelectWatchlist={(id) => setSelectedWatchlistId(id)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Watchlist Management</h1>
            <p className="text-sm text-slate-400 mt-1">Organize stocks, remove inactive symbols, or create custom sector watchlists.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreatingWl(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              New Watchlist
            </button>

            {currentWatchlist && (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Stock
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Create Watchlist Modal / Inline Form */}
        {isCreatingWl && (
          <form onSubmit={handleCreateWatchlist} className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/30 flex items-center gap-3">
            <input
              type="text"
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              placeholder="Watchlist Name (e.g. IT Sector & Tech)..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingWl(false)}
              className="p-2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Watchlist Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          {watchlists.map((wl) => {
            const isSelected = wl.id === selectedWatchlistId;
            return (
              <div key={wl.id} className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedWatchlistId(wl.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  {wl.name} ({wl.items.length})
                </button>
                {isSelected && watchlists.length > 1 && (
                  <button
                    onClick={() => handleDeleteWatchlist(wl.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete Watchlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Watchlist Items Grid / Table */}
        {currentWatchlist && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {currentWatchlist.name} Stocks
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {currentWatchlist.items.length} instruments monitored
              </span>
            </div>

            {currentWatchlist.items.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-4">
                <Layers className="w-10 h-10 text-slate-500 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-white">Your watchlist is empty</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Add the stocks you care about and we'll start watching for meaningful changes.
                  </p>
                </div>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Stock
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/60">
                      <th className="py-3.5 px-6">Instrument</th>
                      <th className="py-3.5 px-6">Exchange</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm">
                    {currentWatchlist.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="py-4 px-6">
                          <Link to={`/stocks/${item.symbol}`} className="block">
                            <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                              {item.symbol}
                            </span>
                            <p className="text-xs text-slate-400">{item.instrument_name}</p>
                          </Link>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                            {item.exchange}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              to={`/stocks/${item.symbol}`}
                              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => handleRemoveStock(item.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Remove from Watchlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Stock Search Modal */}
      <StockSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddStock={handleAddStock}
        existingSymbols={currentWatchlist ? currentWatchlist.items.map(i => i.symbol) : []}
      />
    </div>
  );
};
