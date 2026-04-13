"use client"

import React, { useState } from "react"
import { useStockStore, Asset } from "@/store/useStockStore"
import { useStockUpdater } from "@/hooks/useStockUpdater"
import { getKoreanTickerName, fetchStockData } from "@/services/stockService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Settings as SettingsIcon,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Wallet,
  ArrowRightLeft,
  ChevronUp,
  ChevronDown,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react"

export default function Dashboard() {
  const { tickers, assets, stockData, marketIndices, settings, addTicker, removeTicker, reorderTicker, addAsset, removeAsset, updateAsset, setSettings } = useStockStore()
  const { refresh } = useStockUpdater()
  
  const [mounted, setMounted] = React.useState(false)
  const [activeView, setActiveView] = useState<'dashboard' | 'portfolio'>('dashboard')
  const [newTicker, setNewTicker] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Asset Form State
  const [assetTicker, setAssetTicker] = useState("")
  const [assetQty, setAssetQty] = useState("")
  const [assetPrice, setAssetPrice] = useState("")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-screen bg-background" />

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }

  const handleAddTicker = async () => {
    if (newTicker) {
      setIsRefreshing(true)
      try {
        const data = await fetchStockData(newTicker)
        addTicker(newTicker)
        if (data?.name) {
          useStockStore.getState().updateStockData(newTicker, { name: data.name })
        }
        setNewTicker("")
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  const handleAddAsset = async () => {
    if (assetTicker && assetQty && assetPrice) {
      setIsRefreshing(true)
      try {
        const data = useStockStore.getState().stockData[assetTicker] || 
                    (await fetchStockData(assetTicker))
        
        addAsset({
          ticker: assetTicker,
          name: data?.name || getKoreanTickerName(assetTicker),
          quantity: Number(assetQty),
          purchasePrice: Number(assetPrice),
        })
        setAssetTicker("")
        setAssetQty("")
        setAssetPrice("")
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  // Calculate Totals
  const totalEquity = assets.reduce((sum, asset) => {
    const currentPrice = stockData[asset.ticker]?.price || 0
    return sum + (currentPrice * asset.quantity)
  }, 0)

  const totalCost = assets.reduce((sum, asset) => sum + (asset.purchasePrice * asset.quantity), 0)
  const totalPL = totalEquity - totalCost
  const plPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0

  const maskTotal = (val: number) => {
    if (settings.privacyMode === 'none') return `₩${val.toLocaleString()}`
    return "••••••"
  }

  const maskProfit = (val: string | number) => {
    if (settings.privacyMode === 'all') return "••••••"
    return typeof val === 'number' ? `₩${val.toLocaleString()}` : val
  }

  const cyclePrivacyMode = () => {
    const modes: ('none' | 'partial' | 'all')[] = ['none', 'partial', 'all']
    const nextIndex = (modes.indexOf(settings.privacyMode) + 1) % modes.length
    setSettings({ privacyMode: modes[nextIndex] })
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar - Desktop Layout */}
      <aside className="w-64 border-r bg-card/50 backdrop-blur-md p-6 hidden md:flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="text-primary-foreground w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">StockStream</h1>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Assets</p>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-50 hover:opacity-100" 
              onClick={cyclePrivacyMode}
              title={`Privacy Mode: ${settings.privacyMode}`}
            >
              {settings.privacyMode === 'none' ? <Eye size={14} /> : (settings.privacyMode === 'partial' ? <Eye size={14} className="opacity-60" /> : <EyeOff size={14} />)}
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">{maskTotal(totalEquity)}</p>
            <div className={`flex items-center gap-1 text-sm ${totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{maskProfit(`${totalPL >= 0 ? '+' : ''}₩${totalPL.toLocaleString()} (${plPercent.toFixed(2)}%)`)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">※ 수익률은 평균 단가 대비 현재가 기준입니다.</p>
          </div>
        </section>

        <nav className="flex-1 flex flex-col gap-2">
          <Button 
            variant={activeView === 'dashboard' ? 'secondary' : 'ghost'} 
            className="justify-start gap-3 w-full" 
            onClick={() => setActiveView('dashboard')}
          >
            <Wallet size={18} /> Dashboard
          </Button>
          <Button 
            variant={activeView === 'portfolio' ? 'secondary' : 'ghost'} 
            className="justify-start gap-3 w-full" 
            onClick={() => setActiveView('portfolio')}
          >
            <ArrowRightLeft size={18} /> Portfolio
          </Button>
        </nav>

        <div className="mt-auto pt-6 border-t">
          <Dialog>
            <DialogTrigger className="flex items-center gap-3 w-full px-4 py-2 hover:bg-muted rounded-md cursor-pointer text-sm font-medium transition-colors">
              <SettingsIcon size={18} /> Settings
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto Refresh Interval (sec)</label>
                  <Input 
                    type="number" 
                    value={settings.refreshInterval} 
                    onChange={(e) => setSettings({ refreshInterval: Number(e.target.value) })}
                  />
                  <p className="text-[10px] text-muted-foreground">전체 종목 데이터를 서버에서 새로 가져오는 주기입니다.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Menu Bar Rotation Interval (sec)</label>
                  <Input 
                    type="number" 
                    value={settings.menuBarInterval} 
                    onChange={(e) => setSettings({ menuBarInterval: Number(e.target.value) })}
                  />
                  <p className="text-[10px] text-muted-foreground">메뉴바 상단에서 종목이 전환되는 주기(속도)입니다.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme</label>
                  <div className="flex gap-2">
                    {['system', 'dark', 'light'].map((t) => (
                      <Button 
                        key={t}
                        variant={settings.theme === t ? 'default' : 'outline'}
                        className="capitalize flex-1"
                        onClick={() => setSettings({ theme: t as any })}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Menu Bar Mode</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'fixed', label: '고정' },
                      { id: 'cycling', label: '순환' },
                      { id: 'off', label: '끄기' }
                    ].map((m) => (
                      <Button 
                        key={m.id}
                        variant={settings.menuBarOption === m.id ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setSettings({ menuBarOption: m.id as any })}
                      >
                        {m.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Menu Bar Ticker</label>
                  <Input 
                    placeholder="e.g. 005930"
                    value={settings.menuBarTicker || ""} 
                    onChange={(e) => setSettings({ menuBarTicker: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground">맥 메뉴바(상단바)에 실시간 가격을 표시할 종목 코드입니다.</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-[10px] text-center text-muted-foreground">※ 모든 설정은 입력 즉시 자동으로 저장됩니다.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background/30 backdrop-blur-sm">
        <header className="h-16 border-b flex items-center justify-between px-8 bg-card/20 sticky top-0 z-10">
          <h2 className="text-lg font-semibold">{activeView === 'dashboard' ? 'Watchlist' : 'Portfolio Analyzer'}</h2>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleRefresh} className={isRefreshing ? 'animate-spin' : ''}>
              <RefreshCcw size={18} />
            </Button>
            <Dialog>
              <DialogTrigger className="flex items-center gap-2 bg-primary text-primary-foreground h-9 px-4 rounded-md text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors">
                <Plus size={16} /> Add Ticker
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Ticker</DialogTitle>
                </DialogHeader>
                <div className="flex gap-2 py-4">
                  <Input 
                    placeholder="Enter ticker (e.g. 005930)" 
                    value={newTicker} 
                    onChange={(e) => setNewTicker(e.target.value)}
                  />
                  <Button onClick={handleAddTicker}>Add</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {activeView === 'dashboard' ? (
            <div className="space-y-6">
              {/* Market Indices Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                {['KOSPI', 'KOSDAQ', 'NAS@IXIC'].map((symbol) => {
                  const data = marketIndices[symbol];
                  const displayName = symbol === 'NAS@IXIC' ? 'NASDAQ' : symbol;
                  const isPositive = data ? data.change >= 0 : true;
                  const changeColor = data ? (isPositive ? 'text-green-500' : 'text-red-500') : 'text-muted-foreground';
                  
                  return (
                    <Card key={symbol} className="bg-card/40 backdrop-blur-md border-muted/50 overflow-hidden group hover:border-primary/30 transition-all duration-300">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{displayName}</p>
                          <p className="text-lg font-bold">
                            {data ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---.--'}
                          </p>
                        </div>
                        <div className={`text-right ${changeColor}`}>
                          <div className="flex items-center justify-end gap-1 font-medium">
                            {data ? (isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />) : null}
                            <span>{data ? `${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%` : '--%'}</span>
                          </div>
                          <p className="text-[10px] opacity-80">
                            {data ? `${isPositive ? '+' : ''}${data.change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '0.00'}
                          </p>
                        </div>
                      </CardContent>
                      <div className={`h-1 w-full ${data ? (isPositive ? 'bg-green-500/30' : 'bg-red-500/30') : 'bg-muted'} group-hover:opacity-100 opacity-30 transition-opacity`} />
                    </Card>
                  );
                })}
              </div>

              <Tabs defaultValue="watchlist" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
                  <TabsTrigger value="assets">My Assets</TabsTrigger>
                </TabsList>

                <TabsContent value="watchlist">
                  <div className="rounded-xl border bg-card/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Change</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickers.map((ticker, index) => {
                          const data = stockData[ticker]
                          const name = data?.name || getKoreanTickerName(ticker)
                          return (
                            <TableRow key={ticker}>
                              <TableCell className="font-medium">
                                <div>{name}</div>
                                <div className="text-xs text-muted-foreground">{ticker}</div>
                              </TableCell>
                              <TableCell>₩{data?.price?.toLocaleString() || '...'}</TableCell>
                              <TableCell>
                                <Badge variant={data?.change >= 0 ? "default" : "destructive"} className={data?.change >= 0 ? 'bg-green-500 hover:bg-green-600' : ''}>
                                  {data?.change >= 0 ? '+' : ''}{data?.changePercent?.toFixed(2)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs">
                                {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    disabled={index === 0}
                                    onClick={() => reorderTicker(index, 'up')}
                                  >
                                    <ChevronUp size={16} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    disabled={index === tickers.length - 1}
                                    onClick={() => reorderTicker(index, 'down')}
                                  >
                                    <ChevronDown size={16} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" 
                                    onClick={() => removeTicker(ticker)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="assets">
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Add to Portfolio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase">Ticker</label>
                            <Input placeholder="005930" value={assetTicker} onChange={(e) => setAssetTicker(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase">Qty (수량)</label>
                            <Input type="number" placeholder="10" value={assetQty} onChange={(e) => setAssetQty(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase">Avg Price (평균 단가)</label>
                            <Input type="number" placeholder="70000" value={assetPrice} onChange={(e) => setAssetPrice(e.target.value)} />
                          </div>
                          <div className="flex items-end">
                            <Button className="w-full" onClick={handleAddAsset} disabled={isRefreshing}>
                              {isRefreshing ? "Checking..." : "Add Asset"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="rounded-xl border bg-card/50 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Avg. Cost</TableHead>
                            <TableHead>Current</TableHead>
                            <TableHead>P/L</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assets.map((asset) => {
                            const currentPrice = stockData[asset.ticker]?.price || 0
                            const totalValue = currentPrice * asset.quantity
                            const totalCost = asset.purchasePrice * asset.quantity
                            const pl = totalValue - totalCost
                            const plRate = totalCost > 0 ? (pl / totalCost) * 100 : 0
                            
                            return (
                              <TableRow key={asset.id}>
                                <TableCell className="font-medium">
                                  <div>{stockData[asset.ticker]?.name || asset.name}</div>
                                  <div className="text-xs text-muted-foreground">{asset.ticker}</div>
                                </TableCell>
                                <TableCell>{asset.quantity}</TableCell>
                                <TableCell>{maskProfit(asset.purchasePrice)}</TableCell>
                                <TableCell>₩{currentPrice.toLocaleString()}</TableCell>
                                <TableCell className={pl >= 0 ? 'text-green-500' : 'text-red-500'}>
                                  {maskProfit(`${pl >= 0 ? '+' : ''}₩${pl.toLocaleString()} (${plRate.toFixed(2)}%)`)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <AssetEditDialog asset={asset} />
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" 
                                      onClick={() => removeAsset(asset.id)}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <PortfolioView assets={assets} stockData={stockData} settings={settings} />
          )}
        </div>
      </main>
    </div>
  )
}

function AssetEditDialog({ asset }: { asset: Asset }) {
  const { updateAsset } = useStockStore()
  const [qty, setQty] = useState(asset.quantity.toString())
  const [price, setPrice] = useState(asset.purchasePrice.toString())
  const [open, setOpen] = useState(false)

  const handleUpdate = () => {
    updateAsset(asset.id, {
      quantity: Number(qty),
      purchasePrice: Number(price),
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 transition-colors">
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Asset: {asset.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity (수량)</label>
            <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Avg. Unit Price (평균 단가)</label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PortfolioView({ assets, stockData, settings }: { assets: Asset[], stockData: Record<string, any>, settings: any }) {
  if (assets.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
      <Wallet size={48} className="mb-4 opacity-20" />
      <p>자산을 추가하면 분석 그래프를 볼 수 있습니다.</p>
    </div>
  )

  const data = assets.map(asset => {
    const value = (stockData[asset.ticker]?.price || 0) * asset.quantity
    return { name: stockData[asset.ticker]?.name || asset.name, value, ticker: asset.ticker }
  }).filter(d => d.value > 0)
  
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

  // SVG Chart calculation
  let currentPos = 0
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asset Distribution (자산 비중)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {data.map((d, i) => {
                const percent = (d.value / total) * 100
                const dashArray = `${percent} ${100 - percent}`
                const dashOffset = -currentPos
                currentPos += percent
                return (
                  <circle
                    key={d.ticker}
                    cx="50" cy="50" r="40"
                    fill="transparent"
                    stroke={colors[i % colors.length]}
                    strokeWidth="15"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    pathLength="100"
                    className="transition-all duration-500 hover:stroke-width-[18]"
                  />
                )
              })}
              <circle cx="50" cy="50" r="30" fill="currentColor" className="text-card" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-muted-foreground">Total Value</span>
              <span className="text-lg font-bold">
                {settings.privacyMode === 'none' ? `₩${total.toLocaleString()}` : "••••••"}
              </span>
            </div>
          </div>
          
          <div className="mt-8 w-full grid grid-cols-2 gap-4">
            {data.map((d, i) => (
              <div key={d.ticker} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-sm truncate flex-1">{d.name}</span>
                <span className="text-xs font-medium">{((d.value / total) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-card/50 border">
              <span className="text-sm text-muted-foreground">총 종목 수</span>
              <span className="font-bold">{data.length} 종목</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-card/50 border">
              <span className="text-sm text-muted-foreground">최대 비중 종목</span>
              <span className="font-bold">{data.sort((a,b) => b.value - a.value)[0]?.name || '-'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
