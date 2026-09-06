import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Watchlist } from '../types';
import { 
  Activity, Layers, Sliders, LogOut, Zap, User as UserIcon, ListFilter, ShieldCheck 
} from 'lucide-react';
import { DemoLabModal } from './DemoLabModal';

interface NavbarProps {
  watchlists?: Watchlist[];
  activeWatchlistId?: string;
  onSelectWatchlist?: (id: string) => void;
  onRefreshDashboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  watchlists = [],
  activeWatchlistId,
  onSelectWatchlist,
  onRefreshDashboard
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDemoLabOpen, setIsDemoLabOpen] = useState(false);

  const isDemoAccount = user?.email === 'demo@pulsewatch.app';

  return (
    <>
      <nav className="bg-[#0D1322] border-b border-slate-800 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Brand */}
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-lg text-white tracking-tight">PulseWatch</span>
                  <span className="text-[10px] text-indigo-400 block -mt-1 font-semibold tracking-wider uppercase">
                    Smart Watchlist
                  </span>
                </div>
              </Link>

              {/* Watchlist Quick Switcher */}
              {watchlists.length > 0 && onSelectWatchlist && (
                <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800">
                  <ListFilter className="w-4 h-4 text-slate-500" />
                  <select
                    value={activeWatchlistId || watchlists[0]?.id}
                    onChange={(e) => onSelectWatchlist(e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    {watchlists.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.items.length})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Middle Nav Links */}
            <div className="hidden sm:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Activity className="w-4 h-4 text-indigo-400" />
                Dashboard
              </Link>

              <Link
                to="/watchlists"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  location.pathname === '/watchlists'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                Watchlists
              </Link>

              <Link
                to="/settings"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  location.pathname === '/settings'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Sliders className="w-4 h-4 text-indigo-400" />
                Settings
              </Link>
            </div>

            {/* Right Action Bar & User Profile */}
            <div className="flex items-center gap-3">
              
              {/* Evaluator Demo Lab Trigger */}
              <button
                onClick={() => setIsDemoLabOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
                <span>Demo Lab</span>
              </button>

              {/* User Identity Pill */}
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left text-xs">
                  <span className="block font-bold text-white leading-tight">
                    {user?.name || 'Authenticated User'}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono">
                    {isDemoAccount ? 'Demo Account' : user?.email}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>

            </div>

          </div>
        </div>
      </nav>

      {/* Demo Lab Modal */}
      <DemoLabModal
        isOpen={isDemoLabOpen}
        onClose={() => setIsDemoLabOpen(false)}
        onShockTriggered={() => {
          if (onRefreshDashboard) onRefreshDashboard();
        }}
      />
    </>
  );
};
