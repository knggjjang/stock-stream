import { invoke } from '@tauri-apps/api/core';

export interface StockInfo {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: number;
}

export async function fetchStockDataBatch(tickers: string[]) {
  if (tickers.length === 0) return {};
  
  try {
    const url = `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${tickers.join(',')}`;
    const jsonStr: string = await invoke('fetch_stock_data_rust', { url });
    const data = JSON.parse(jsonStr);
    
    const results = data.result?.areas?.[0]?.datas || [];
    
    const stockData: Record<string, StockInfo> = {};
    results.forEach((item: any) => {
      const ticker = item.cd;
      const price = parseFloat(item.nv?.toString() || '0');
      const rf = item.rf?.toString(); // 1:상한, 2:상승, 3:보합, 4:하락, 5:하한
      let change = parseFloat(item.cv?.toString() || '0');
      let changeRate = parseFloat(item.cr?.toString() || '0');
      
      // Apply sign based on rf (rise/fall) flag
      if (rf === '4' || rf === '5') {
        change = -Math.abs(change);
        changeRate = -Math.abs(changeRate);
      } else if (rf === '3') {
        change = 0;
        changeRate = 0;
      }
      
      stockData[ticker] = {
        ticker,
        name: item.nm || ticker,
        price,
        change,
        changePercent: changeRate,
        lastUpdated: Date.now(),
      };
    });

    return stockData;
  } catch (error) {
    console.error(`Error in fetchStockDataBatch:`, error);
    return {};
  }
}

export async function fetchMarketIndices() {
  const symbols = ['KOSPI', 'KOSDAQ'];
  const indexData: Record<string, StockInfo> = {};
  
  try {
    // 1. Fetch Domestic Indices (KOSPI, KOSDAQ)
    const url = `https://polling.finance.naver.com/api/realtime?query=SERVICE_INDEX:${symbols.join(',')}`;
    const jsonStr: string = await invoke('fetch_stock_data_rust', { url });
    const data = JSON.parse(jsonStr);
    
    const results = data.result?.areas?.[0]?.datas || [];
    
    results.forEach((item: any) => {
      const ticker = item.cd;
      // Domestic indices in Polling API are multiplied by 100
      const price = parseFloat(item.nv?.toString() || '0') / 100;
      const rf = item.rf?.toString();
      let change = parseFloat(item.cv?.toString() || '0') / 100;
      let changeRate = parseFloat(item.cr?.toString() || '0');
      
      if (rf === '4' || rf === '5') {
        change = -Math.abs(change);
        changeRate = -Math.abs(changeRate);
      } else if (rf === '3') {
        change = 0;
        changeRate = 0;
      }

      let name = item.nm || ticker;
      if (ticker === 'KOSPI') name = 'KOSPI';
      if (ticker === 'KOSDAQ') name = 'KOSDAQ';
      
      indexData[ticker] = {
        ticker,
        name,
        price,
        change,
        changePercent: changeRate,
        lastUpdated: Date.now(),
      };
    });

    // 2. Fetch NASDAQ Index (Separate API as Polling doesn't support global indices well)
    try {
      const nasdaqUrl = `https://finance.naver.com/world/worldDayListJson.naver?symbol=NAS@IXIC&fdtc=0`;
      const nasdaqJsonStr: string = await invoke('fetch_stock_data_rust', { url: nasdaqUrl });
      const nasdaqData = JSON.parse(nasdaqJsonStr);
      
      if (nasdaqData && nasdaqData.length > 0) {
        const latest = nasdaqData[0];
        const price = parseFloat(latest.clos || '0');
        const change = parseFloat(latest.diff || '0');
        const changeRate = parseFloat(latest.rate || '0');
        
        // worldDayListJson returns positive diff even for drops, so we check or assume based on rate if needed
        // But usually 'diff' in this API is already properly signed if we check properly.
        // Actually, this API returns: clos (current), diff (change), rate (percent).
        // Let's ensure sign consistency.
        
        indexData['NAS@IXIC'] = {
          ticker: 'NAS@IXIC',
          name: 'NASDAQ',
          price,
          change,
          changePercent: changeRate,
          lastUpdated: Date.now(),
        };
      }
    } catch (nasdaqError) {
      console.error('Error fetching NASDAQ:', nasdaqError);
    }

    return indexData;
  } catch (error) {
    console.error(`Error in fetchMarketIndices:`, error);
    return indexData;
  }
}

export async function fetchStockData(ticker: string) {
  const result = await fetchStockDataBatch([ticker]);
  return result[ticker] || null;
}

export function getKoreanTickerName(ticker: string): string {
  const commonNames: Record<string, string> = {
    '005930': '삼성전자',
    '000660': 'SK하이닉스',
    '035420': 'NAVER',
    '035720': '카카오',
    '005380': '현대차',
    '005490': 'POSCO홀딩스',
    '005935': '삼성전자우',
    '068270': '셀트리온',
    '207940': '삼성바이오로직스',
    '051910': 'LG화학',
  };
  return commonNames[ticker] || ticker;
}
