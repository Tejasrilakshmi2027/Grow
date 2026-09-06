export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  symbol: string;
  instrument_name: string;
  exchange: string;
  created_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  items: WatchlistItem[];
}

export interface FreshnessMetadata {
  source: string;
  source_timestamp?: string | null;
  fetched_at: string;
  age_seconds?: number | null;
  status: 'fresh' | 'aging' | 'stale' | 'timestamp_unavailable';
  data_mode: 'live' | 'demo';
  timestamp_available?: boolean;
}

export interface StockQuote {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change_absolute: number;
  change_percent: number;
  open: number;
  high: number;
  low: number;
  previous_close: number;
  volume: number;
  avg_volume_20d: number;
  volume_ratio: number;
  volatility_20d: number;
  market_cap?: number | null;
  market_return?: number | null;
  relative_outperformance?: number | null;
  freshness: FreshnessMetadata;
  data_mode: 'live' | 'demo';
}

export interface SignalContribution {
  name: string;
  code: string;
  raw_value: number;
  contribution: number;
  weight: number;
  description: string;
}

export interface ExplanationOut {
  summary: string;
  bullets: string[];
  confidence_score: number;
  signals: SignalContribution[];
}

export interface ChangeEventPayload {
  price_move?: number;
  price_change_pct?: number;
  volume_ratio?: number;
  volume_mult?: number;
  triggered_by?: string;
  data_mode?: string;
  [key: string]: unknown;
}

export interface ChangeEventOut {
  id: string;
  symbol: string;
  watchlist_id?: string;
  event_type: string;
  occurred_at: string;
  score: number;
  severity: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  headline: string;
  payload: ChangeEventPayload;
}

export interface DemoShockResponse {
  status: string;
  message: string;
  details: {
    price_change_pct: number;
    volume_mult: number;
    headline: string;
    calculated_score: number;
    severity: string;
  };
}

export interface StockAttentionCard {
  symbol: string;
  instrument_name: string;
  exchange: string;
  quote: StockQuote;
  attention_score: number;
  severity: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  last_checked_at?: string;
  since_last_checked_text: string;
  key_signals: string[];
  explanation: ExplanationOut;
  recent_events: ChangeEventOut[];
}

export interface UnchangedStockCard {
  symbol: string;
  instrument_name: string;
  price: number;
  change_percent: number;
  volume_ratio: number;
  reason: string;
}

export interface DashboardOverview {
  watchlist_id: string;
  watchlist_name: string;
  user_name: string;
  last_checked_at?: string;
  is_first_visit: boolean;
  need_attention_count: number;
  meaningful_changes_count: number;
  unchanged_count: number;
  attention_cards: StockAttentionCard[];
  unchanged_cards: UnchangedStockCard[];
  freshness: {
    source: string;
    is_fresh: boolean;
    checked_at: string;
  };
}

export interface ChartPoint {
  timestamp: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

export interface InstrumentSearch {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price?: number | null;
  change_percent?: number | null;
  data_mode: 'live' | 'demo';
  is_available: boolean;
}

// Type aliases for strict codebase alignment
export type DashboardData = DashboardOverview;
export type AttentionCardData = StockAttentionCard;
