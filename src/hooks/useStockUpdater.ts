import { useEffect, useRef } from 'react'
import { useStockStore } from '@/store/useStockStore'
import { fetchStockDataBatch, fetchMarketIndices } from '@/services/stockService'
import { invoke } from '@tauri-apps/api/core'

export function useStockUpdater() {
  const { tickers, setStockData, setMarketIndices, settings, stockData } = useStockStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const rotationIndexRef = useRef(0)
  const isFetchingRef = useRef(false)
  const lastFetchTimeRef = useRef(0)
  const trayIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const updateAll = async (force = false) => {
    if (isFetchingRef.current) return
    
    // Throttling: Prevent fetching more than once every 5 seconds (safety for dev mode/strict mode)
    const now = Date.now()
    if (!force && now - lastFetchTimeRef.current < 5000) return

    isFetchingRef.current = true
    lastFetchTimeRef.current = now

    console.log(`[Updater] Fetching data for stocks and indices`)
    
    // Fetch both stocks and indices
    const [newData, indexData] = await Promise.all([
      tickers.length > 0 ? fetchStockDataBatch(tickers) : Promise.resolve({}),
      fetchMarketIndices()
    ])
    
    if (Object.keys(newData).length > 0) {
      setStockData(newData)
    }
    
    if (Object.keys(indexData).length > 0) {
      setMarketIndices(indexData)
    }
    
    isFetchingRef.current = false
  }

  const updateTray = async () => {
    try {
      let trayTitle = ""
      if (settings.menuBarOption === 'off') {
        trayTitle = ""
      } else if (settings.menuBarOption === 'fixed' && settings.menuBarTicker) {
        const data = stockData[settings.menuBarTicker]
        if (data) {
          trayTitle = `${data.name || settings.menuBarTicker}: ₩${data.price?.toLocaleString()}`
        }
      } else if (settings.menuBarOption === 'cycling' && tickers.length > 0) {
        const nextIndex = rotationIndexRef.current % tickers.length
        const ticker = tickers[nextIndex]
        const data = stockData[ticker]
        if (data) {
          trayTitle = `${data.name || ticker}: ₩${data.price?.toLocaleString()}`
        }
        rotationIndexRef.current += 1
      }
      
      await invoke('update_tray_title', { title: trayTitle })
    } catch (err) {
      console.error('Failed to update tray:', err)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => updateAll(true), 1000)
    const intervalMs = (settings.refreshInterval || 300) * 1000
    intervalRef.current = setInterval(() => updateAll(), intervalMs)

    return () => {
      clearTimeout(timeout)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tickers, settings.refreshInterval])

  // Separate interval for Tray rotation
  useEffect(() => {
    const timeout = setTimeout(() => updateTray(), 1500)
    const trayIntervalMs = (settings.menuBarInterval || 10) * 1000
    trayIntervalRef.current = setInterval(() => updateTray(), trayIntervalMs)

    return () => {
      clearTimeout(timeout)
      if (trayIntervalRef.current) clearInterval(trayIntervalRef.current)
    }
  }, [tickers, settings.menuBarOption, settings.menuBarTicker, settings.menuBarInterval, stockData])

  return { refresh: () => updateAll(true) }
}
