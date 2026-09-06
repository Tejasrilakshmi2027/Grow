import { 
  AuthResponse, User, Watchlist, WatchlistItem, 
  DashboardOverview, StockQuote, ChartPoint, InstrumentSearch, ChangeEventOut, MarketIndex,
  DemoShockResponse
} from '../types';

const rawBase = import.meta.env.VITE_API_URL;
const API_BASE = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/$/, '')}/api`) : '/api';

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('pulsewatch_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'An unexpected network error occurred.' }));
      throw new Error(errorData.detail || `HTTP Error ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth APIs
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Watchlist APIs
  async getWatchlists(): Promise<Watchlist[]> {
    return this.request<Watchlist[]>('/watchlists');
  }

  async createWatchlist(name: string): Promise<Watchlist> {
    return this.request<Watchlist>('/watchlists', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async addWatchlistItem(watchlistId: string, symbol: string, instrumentName: string, exchange: string = 'NSE'): Promise<WatchlistItem> {
    return this.request<WatchlistItem>(`/watchlists/${watchlistId}/items`, {
      method: 'POST',
      body: JSON.stringify({ symbol, instrument_name: instrumentName, exchange }),
    });
  }

  async removeWatchlistItem(watchlistId: string, itemId: string): Promise<void> {
    await this.request<void>(`/watchlists/${watchlistId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async deleteWatchlist(watchlistId: string): Promise<void> {
    await this.request<void>(`/watchlists/${watchlistId}`, {
      method: 'DELETE',
    });
  }

  // Dashboard APIs
  async getDashboard(watchlistId?: string): Promise<DashboardOverview> {
    const query = watchlistId ? `?watchlist_id=${watchlistId}` : '';
    return this.request<DashboardOverview>(`/dashboard${query}`);
  }

  async markCheckpoint(watchlistId: string): Promise<void> {
    await this.request<void>(`/dashboard/checkpoint/${watchlistId}`, {
      method: 'POST',
    });
  }

  async updateCheckpoint(watchlistId: string): Promise<void> {
    return this.markCheckpoint(watchlistId);
  }

  // Stocks & Market APIs
  async getMarketIndices(): Promise<MarketIndex[]> {
    return this.request<MarketIndex[]>('/stocks/indices');
  }

  async searchStocks(query: string): Promise<InstrumentSearch[]> {
    return this.request<InstrumentSearch[]>(`/stocks/search?query=${encodeURIComponent(query)}`);
  }

  async getStockQuote(symbol: string): Promise<StockQuote> {
    return this.request<StockQuote>(`/stocks/${encodeURIComponent(symbol)}`);
  }

  async getStockHistory(symbol: string, range: string = '1M'): Promise<ChartPoint[]> {
    return this.request<ChartPoint[]>(`/stocks/${encodeURIComponent(symbol)}/history?range=${range}`);
  }

  async getStockEvents(symbol: string): Promise<ChangeEventOut[]> {
    return this.request<ChangeEventOut[]>(`/stocks/${encodeURIComponent(symbol)}/events`);
  }

  // Demo Shock Trigger API
  async triggerDemoShock(symbol: string, priceChangePct: number, volumeMult: number, headline?: string): Promise<DemoShockResponse> {
    return this.request<DemoShockResponse>('/demo/trigger-shock', {
      method: 'POST',
      body: JSON.stringify({
        symbol,
        price_change_pct: priceChangePct,
        volume_mult: volumeMult,
        headline: headline || `Demo Surge: +${priceChangePct}% with ${volumeMult}x volume anomaly`,
      }),
    });
  }
}

export const api = new ApiClient();
