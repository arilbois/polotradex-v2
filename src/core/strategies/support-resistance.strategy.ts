import { Exchange } from 'ccxt';
import { StrategySignal, OHLCV, BotConfig } from '@shared/interfaces/trading.interface';
import { logger } from '@infrastructure/logger';
import { IStrategy } from './IStrategy';
import { analysisService } from '../../container';

// Tentukan seberapa dekat harga harus ke level S/R untuk dianggap "menyentuh" (dalam persentase)
const PROXIMITY_PERCENTAGE = 0.5; // 0.5%

export class SupportResistanceStrategy implements IStrategy {
  private params: BotConfig | null = null;

  constructor() {
    logger.info('SupportResistanceStrategy instance created.');
  }

  public updateParams(params: BotConfig): void {
    this.params = params;
    this.validateParams();
  }

  private validateParams(): void {
    if (!this.params) throw new Error('S/R Strategy parameters not set.');
    logger.info(`S/R Strategy parameters updated`, { params: this.params });
  }

  public async generateSignal(exchange: Exchange, symbol: string): Promise<StrategySignal> {
    if (!this.params) throw new Error('Strategy not initialized with parameters.');
    
    try {
      const ohlcvData = await this.fetchOHLCVData(exchange, symbol);
      
      // 1. Dapatkan level Support & Resistance dari AnalysisService
      const { supports, resistances } = analysisService.findSupportResistanceLevels(
        ohlcvData,
        this.params.srPivotStrength
      );

      if (supports.length === 0 && resistances.length === 0) {
        return { action: 'HOLD', confidence: 0, reason: 'No S/R levels found', timestamp: new Date(), OrderAmount: 0 };
      }

      const lastCandle = ohlcvData[ohlcvData.length - 1];
      const currentPrice = lastCandle.close;

      // 2. Cek Sinyal Beli (Pantulan dari Support)
      for (const supportLevel of supports) {
        const proximity = supportLevel * (PROXIMITY_PERCENTAGE / 100);
        // Apakah harga saat ini dekat dengan support?
        if (Math.abs(currentPrice - supportLevel) < proximity) {
          // Konfirmasi: Apakah candle terakhir hijau (menunjukkan pantulan)?
          if (lastCandle.close > lastCandle.open) {
            return {
              action: 'BUY',
              confidence: 0.8,
              reason: `Bounce from Support at ${supportLevel.toFixed(4)}`,
              timestamp: new Date(),
              metadata: { level: supportLevel },
              OrderAmount: 0,
            };
          }
        }
      }

      // 3. Cek Sinyal Jual (Penolakan dari Resistance)
      for (const resistanceLevel of resistances) {
        const proximity = resistanceLevel * (PROXIMITY_PERCENTAGE / 100);
        // Apakah harga saat ini dekat dengan resistance?
        if (Math.abs(currentPrice - resistanceLevel) < proximity) {
          // Konfirmasi: Apakah candle terakhir merah (menunjukkan penolakan)?
          if (lastCandle.close < lastCandle.open) {
            return {
              action: 'SELL',
              confidence: 0.8,
              reason: `Rejection from Resistance at ${resistanceLevel.toFixed(4)}`,
              timestamp: new Date(),
              metadata: { level: resistanceLevel },
              OrderAmount: 0,
            };
          }
        }
      }

      return { action: 'HOLD', confidence: 0.5, reason: 'Price is between S/R levels', timestamp: new Date(), OrderAmount: 0 };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to generate S/R signal for ${symbol}:`, errorMessage);
      return { action: 'HOLD', confidence: 0, reason: `Error: ${errorMessage}`, timestamp: new Date(), OrderAmount: 0 };
    }
  }

  private async fetchOHLCVData(exchange: Exchange, symbol: string): Promise<OHLCV[]> {
    if (!this.params) throw new Error('Strategy not initialized with parameters.');
    const limit = this.params.srLookbackPeriod;
    const ohlcvRaw = await exchange.fetchOHLCV(symbol, this.params.timeframe, undefined, limit);
    return ohlcvRaw.filter(c => c.every(val => typeof val === 'number')).map(c => ({ timestamp: c[0] as number, open: c[1] as number, high: c[2] as number, low: c[3] as number, close: c[4] as number, volume: c[5] as number }));
  }
}
