import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { MarketPulseHeader } from '../components/MarketPulseHeader';
import { AttentionCard } from '../components/AttentionCard';
import { AttentionSpectrum } from '../components/AttentionSpectrum';
import { WhyThisMattersDrawer } from '../components/WhyThisMattersDrawer';
import { DashboardOverview, StockAttentionCard, Watchlist } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, 
  Layers, Clock, ShieldCheck, Sparkles, Plus, Eye 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [drawerCard, setDrawerCard] = useState<StockAttentionCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (wlId?: string, isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [wls, dash] = await Promise.all([
        api.getWatchlists(),
        api.getDashboard(wlId)
      ]);
      setWatchlists(wls);
      setDashboard(dash);
      if (dash.watchlist_id) setSelectedWatchlistId(dash.watchlist_id);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load Smart Watchlist dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(selectedWatchlistId);
  }, [selectedWatchlistId]);

  const handleMarkSeen = async () => {
    if (!dashboard) return;
    try {
      await api.markCheckpoint(dashboard.watchlist_id);
      await loadData(dashboard.watchlist_id, true);
    } catch (err: unknown) {
      console.error("Failed to update checkpoint:", err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen bg-[#090D16]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-medium">Calculating signal changes since your last check...</p>
        </div>
      </div>
    );
  }

  const attentionCards = dashboard?.attention_cards || [];
  const unchangedCards = dashboard?.unchanged_cards || [];

  return (
    <div className="min-h-screen bg-[#090D16] pb-16">
      
      {/* Live Market Pulse Header Strip */}
      <MarketPulseHeader
        dataMode={dashboard?.freshness?.source === 'demo' ? 'demo' : 'live'}
        lastUpdatedText={dashboard?.last_checked_at ? `Last Seen ${new Date(dashboard.last_checked_at).toLocaleString()}` : 'Real-Time'}
      />

      {/* Primary Navigation */}
      <Navbar
        watchlists={watchlists}
        activeWatchlistId={selectedWatchlistId}
        onSelectWatchlist={(id) => setSelectedWatchlistId(id)}
        onRefreshDashboard={() => loadData(selectedWatchlistId, true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* User Welcome Banner & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Trader'}
            </h1>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>
                {dashboard?.is_first_visit 
                  ? 'First visit baseline established. Monitoring live changes.' 
                  : `Changes calculated since your last check (${dashboard?.last_checked_at ? new Date(dashboard.last_checked_at).toLocaleString() : 'now'}).`}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(selectedWatchlistId, true)}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Feed
            </button>

            <button
              onClick={handleMarkSeen}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark All as Seen
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Counter Summary Metric Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#0D1322] border border-red-500/30 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Need Immediate Attention</span>
              <div className="text-3xl font-extrabold text-white font-mono mt-1">
                {dashboard?.need_attention_count || 0}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">High / Medium Attention Score &gt; 45</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-extrabold text-xl font-mono">
              !
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D1322] border border-indigo-500/30 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Meaningful Changes</span>
              <div className="text-3xl font-extrabold text-white font-mono mt-1">
                {dashboard?.meaningful_changes_count || 0}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Price or Volume Deviation Detected</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-xl font-mono">
              ⚡
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unchanged / Normal</span>
              <div className="text-3xl font-extrabold text-white font-mono mt-1">
                {unchangedCards.length}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">No Action Needed</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-extrabold text-xl font-mono">
              ✓
            </div>
          </div>
        </div>

        {/* Visual Attention Spectrum Radar */}
        {attentionCards.length > 0 && (
          <AttentionSpectrum
            cards={attentionCards}
            onSelectStock={(card) => setDrawerCard(card)}
          />
        )}

        {/* Primary Section: Since You Last Checked */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Since You Last Checked
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Surfacing instruments ranked by highest calculated attention score.
              </p>
            </div>
          </div>

          {attentionCards.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No Meaningful Changes Detected</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All stocks in your watchlist are trading within normal baseline standard deviation bounds since your last check.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attentionCards.map((card) => (
                <AttentionCard
                  key={card.symbol}
                  data={card}
                  onWhyThisMatters={(c) => setDrawerCard(c)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Collapsible Section: Unchanged Stocks */}
        {unchangedCards.length > 0 && (
          <div className="border-t border-slate-800/80 pt-6 space-y-4">
            <button
              onClick={() => setShowUnchanged(!showUnchanged)}
              className="flex items-center justify-between w-full p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-300">
                  Unchanged / Normal Activity ({unchangedCards.length})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Trading within normal standard deviation bounds
                </span>
              </div>
              {showUnchanged ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showUnchanged && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {unchangedCards.map((card) => (
                  <div key={card.symbol} className="bg-[#0D1322] border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-extrabold text-xl text-white">{card.symbol}</h3>
                        <p className="text-xs text-slate-400">{card.instrument_name}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        NORMAL
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between py-2 border-y border-slate-800/80">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500">Current Quote</span>
                        <div className="text-2xl font-extrabold text-white font-mono mt-0.5">
                          ₹{card.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold">
                        <div className={`text-base ${card.change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {card.change_percent >= 0 ? '+' : ''}{card.change_percent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                      {card.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Transparent Why This Matters Drawer */}
      <WhyThisMattersDrawer
        card={drawerCard}
        isOpen={!!drawerCard}
        onClose={() => setDrawerCard(null)}
      />

    </div>
  );
};
