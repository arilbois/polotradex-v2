// src/core/strategies/macd.strategy.ts (File Baru)
import { MACD } from 'technicalindicators';
import { Exchange } from 'ccxt';
import { StrategySignal, OHLCV, BotConfig } from '@shared/interfaces/trading.interface';
import { logger } from '@infrastructure/logger';
import { IStrategy } from './IStrategy';

export class MACDStrategy implements IStrategy {
  private params: BotConfig | null = null;

  constructor() {
    logger.info('MACDStrategy instance created.');
  }

  public updateParams(params: BotConfig): void {
    this.params = params;
    this.validateParams();
  }

  private validateParams(): void {
    if (!this.params) throw new Error('MACD Strategy parameters not set.');
    if (this.params.macdFastPeriod >= this.params.macdSlowPeriod) {
      throw new Error('MACD fast period must be less than slow period.');
    }
    logger.info(`MACD Strategy parameters updated`, { params: this.params });
  }

  public async generateSignal(exchange: Exchange, symbol: string): Promise<StrategySignal> {
    if (!this.params) throw new Error('Strategy not initialized with parameters.');
    
    try {
      const ohlcvData = await this.fetchOHLCVData(exchange, symbol);
      
      const closePrices = ohlcvData.map(c => c.close);
      
      const macdInput = {
        values: closePrices,
        fastPeriod: this.params.macdFastPeriod,
        slowPeriod: this.params.macdSlowPeriod,
        signalPeriod: this.params.macdSignalPeriod,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      };

      const macdValues = MACD.calculate(macdInput);
      if (macdValues.length < 2) {
        return { action: 'HOLD', confidence: 0, reason: 'Insufficient data for MACD calculation', timestamp: new Date(), OrderAmount: 0 };
      }

      // Ambil dua data terakhir untuk mendeteksi persilangan
      const last = macdValues[macdValues.length - 1];
      const previous = macdValues[macdValues.length - 2];

      return this.analyzeMACD(last, previous);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to generate MACD signal for ${symbol}:`, errorMessage);
      return { action: 'HOLD', confidence: 0, reason: `Error: ${errorMessage}`, timestamp: new Date(), OrderAmount: 0 };
    }
  }

  private async fetchOHLCVData(exchange: Exchange, symbol: string): Promise<OHLCV[]> {
    if (!this.params) throw new Error('Strategy not initialized with parameters.');
    // Ambil lebih banyak data untuk MACD
    const limit = this.params.macdSlowPeriod * 2;
    const ohlcvRaw = await exchange.fetchOHLCV(symbol, this.params.timeframe, undefined, limit);
    return ohlcvRaw.filter(c => c.every(val => typeof val === 'number'))
                   .map(c => ({ 
                     timestamp: c[0] as number, 
                     open: c[1] as number, 
                     high: c[2] as number, 
                     low: c[3] as number, 
                     close: c[4] as number, 
                     volume: c[5] as number 
                   }));
  }

  private analyzeMACD(last: any, previous: any): StrategySignal {
    const { MACD: lastMACD, signal: lastSignal } = last;
    const { MACD: prevMACD, signal: prevSignal } = previous;

    // Golden Cross (Sinyal Beli): Garis MACD memotong ke atas garis sinyal
    if (prevMACD < prevSignal && lastMACD > lastSignal) {
      return { action: 'BUY', confidence: 0.75, reason: 'MACD Golden Cross', timestamp: new Date(), metadata: { macd: lastMACD, signal: lastSignal }, OrderAmount: 0 };
    }

    // Death Cross (Sinyal Jual): Garis MACD memotong ke bawah garis sinyal
    if (prevMACD > prevSignal && lastMACD < lastSignal) {
      return { action: 'SELL', confidence: 0.75, reason: 'MACD Death Cross', timestamp: new Date(), metadata: { macd: lastMACD, signal: lastSignal }, OrderAmount: 0 };
    }
    
    return { action: 'HOLD', confidence: 0.5, reason: 'No MACD crossover', timestamp: new Date(), metadata: { macd: lastMACD, signal: lastSignal }, OrderAmount: 0 };
  }
}
