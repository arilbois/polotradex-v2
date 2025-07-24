import { Exchange } from 'ccxt';
import { StrategySignal, OHLCV, BotConfig } from '@shared/interfaces/trading.interface';
import { logger } from '@infrastructure/logger';
import { IStrategy } from './IStrategy';
import { analysisService } from '../../container';
import { SMA } from 'technicalindicators'; // Baru

const PROXIMITY_PERCENTAGE = 0.5;

// Fungsi helper untuk menentukan tren di timeframe yang lebih tinggi
const getMtfTrend = (mtfOhlcv: OHLCV[]): 'UP' | 'DOWN' | 'SIDEWAYS' => {
  if (mtfOhlcv.length < 20) return 'SIDEWAYS'; // Butuh data yang cukup

  const closePrices = mtfOhlcv.map(c => c.close);
  const sma20 = SMA.calculate({ period: 20, values: closePrices });
  const lastPrice = closePrices[closePrices.length - 1];
  const lastSma = sma20[sma20.length - 1];

  if (lastPrice > lastSma) return 'UP';
  if (lastPrice < lastSma) return 'DOWN';
  return 'SIDEWAYS';
};

export class SupportResistanceStrategy implements IStrategy {
  private params: BotConfig | null = null;

  constructor() {
    logger.info('SupportResistanceStrategy instance created.');
  }

  public updateParams(params: BotConfig): void {
    this.params = params;
  }

  public async generateSignal(exchange: Exchange, symbol: string): Promise<StrategySignal> {
    if (!this.params) throw new Error('Strategy not initialized with parameters.');
    
    try {
      logger.info(`[${this.constructor.name}] Generating signal for ${symbol}`, { params: this.params });
      // 1. Ambil data untuk timeframe utama dan MTF
      const [ohlcvData, mtfOhlcvData] = await Promise.all([
        this.fetchOHLCVData(exchange, symbol, this.params.timeframe, this.params.srLookbackPeriod),
        this.fetchOHLCVData(exchange, symbol, this.params.mtfTimeframe, 50) // Ambil 50 candle untuk MTF
      ]);
      
      // 2. Tentukan tren di MTF
      const mtfTrend = getMtfTrend(mtfOhlcvData);
      logger.info(`[SR Strategy] MTF Trend (${this.params.mtfTimeframe}): ${mtfTrend}`);

      const { supports, resistances } = analysisService.findSupportResistanceLevels(ohlcvData, this.params.srPivotStrength);
      const lastCandle = ohlcvData[ohlcvData.length - 1];
      const currentPrice = lastCandle.close;

      // 3. Cek Sinyal Beli (HANYA jika tren MTF sedang NAIK)
      if (mtfTrend === 'UP') {
        for (const supportLevel of supports) {
          const proximity = supportLevel * (PROXIMITY_PERCENTAGE / 100);
          if (Math.abs(currentPrice - supportLevel) < proximity && lastCandle.close > lastCandle.open) {
            return { action: 'BUY', confidence: 0.85, reason: `Bounce from Support, confirmed by MTF uptrend`, timestamp: new Date(), OrderAmount: 0 };
          }
        }
      }

      // 4. Cek Sinyal Jual (HANYA jika tren MTF sedang TURUN)
      if (mtfTrend === 'DOWN') {
        for (const resistanceLevel of resistances) {
          const proximity = resistanceLevel * (PROXIMITY_PERCENTAGE / 100);
          if (Math.abs(currentPrice - resistanceLevel) < proximity && lastCandle.close < lastCandle.open) {
            return { action: 'SELL', confidence: 0.85, reason: `Rejection from Resistance, confirmed by MTF downtrend`, timestamp: new Date(), OrderAmount: 0 };
          }
        }
      }

      return { action: 'HOLD', confidence: 0.5, reason: `Price between S/R or MTF trend not confirming`, timestamp: new Date(), OrderAmount: 0 };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to generate S/R signal for ${symbol}:`, errorMessage);
        return { action: 'HOLD', confidence: 0, reason: `Error: ${errorMessage}`, timestamp: new Date(), OrderAmount: 0 };
    }
  }

  private async fetchOHLCVData(exchange: Exchange, symbol: string, timeframe: string, limit: number): Promise<OHLCV[]> {
    const ohlcvRaw = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
    return ohlcvRaw.filter(c => c.every(val => typeof val === 'number'))
                   .map(c => ({ timestamp: c[0] as number, open: c[1] as number, high: c[2] as number, low: c[3] as number, close: c[4] as number, volume: c[5] as number }));
  }
}