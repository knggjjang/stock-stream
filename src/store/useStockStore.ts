import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  purchasePrice: number;
}

export interface StockInfo {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: number;
}

type MenuBarOption = 'fixed' | 'cycling' | 'off';
type ThemeOption = 'system' | 'dark' | 'light';

interface StockState {
  tickers: string[];
  assets: Asset[];
  stockData: Record<string, StockInfo>;
  marketIndices: Record<string, StockInfo>;
  settings: {
    refreshInterval: number; // in seconds
    menuBarOption: MenuBarOption;
    menuBarTicker: string | null;
    menuBarInterval: number; // in seconds
    privacyMode: 'none' | 'partial' | 'all';
    theme: ThemeOption;
  };
  addTicker: (ticker: string) => void;
  removeTicker: (ticker: string) => void;
  reorderTicker: (index: number, direction: 'up' | 'down') => void;
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  removeAsset: (id: string) => void;
  updateAsset: (id: string, asset: Partial<Omit<Asset, 'id' | 'ticker'>>) => void;
  updateStockData: (ticker: string, data: Partial<StockInfo>) => void;
  setStockData: (data: Record<string, StockInfo>) => void;
  setMarketIndices: (data: Record<string, StockInfo>) => void;
  setSettings: (settings: Partial<StockState['settings']>) => void;
}

export const useStockStore = create<StockState>()(
  persist(
    (set) => ({
      tickers: ['005930', '000660', '035420'], // Samsung, Hynix, Naver default
      assets: [],
      stockData: {},
      marketIndices: {},
      settings: {
        refreshInterval: 300,
        menuBarOption: 'fixed',
        menuBarTicker: '005930',
        menuBarInterval: 10,
        privacyMode: 'none',
        theme: 'system',
      },
      addTicker: (ticker) => set((state) => ({
        tickers: state.tickers.includes(ticker) ? state.tickers : [...state.tickers, ticker]
      })),
      removeTicker: (ticker) => set((state) => ({
        tickers: state.tickers.filter((t) => t !== ticker)
      })),
      reorderTicker: (index, direction) => set((state) => {
        const newTickers = [...state.tickers];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newTickers.length) {
          [newTickers[index], newTickers[targetIndex]] = [newTickers[targetIndex], newTickers[index]];
        }
        return { tickers: newTickers };
      }),
      addAsset: (asset) => set((state) => ({
        assets: [...state.assets, { ...asset, id: crypto.randomUUID() }]
      })),
      removeAsset: (id) => set((state) => ({
        assets: state.assets.filter((a) => a.id !== id)
      })),
      updateAsset: (id, updatedFields) => set((state) => ({
        assets: state.assets.map((a) => a.id === id ? { ...a, ...updatedFields } : a)
      })),
      updateStockData: (ticker, data) => set((state) => ({
        stockData: {
          ...state.stockData,
          [ticker]: { ...(state.stockData[ticker] || { ticker, name: '', price: 0, change: 0, changePercent: 0, lastUpdated: 0 }), ...data }
        }
      })),
      setStockData: (data) => set((state) => ({
        stockData: { ...state.stockData, ...data }
      })),
      setMarketIndices: (data) => set((state) => ({
        marketIndices: { ...state.marketIndices, ...data }
      })),
      setSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
    }),
    {
      name: 'stock-stream-storage',
    }
  )
);
