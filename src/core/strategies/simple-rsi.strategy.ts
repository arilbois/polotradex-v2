import { RSI } from 'technicalindicators';
import { StrategySignal, OHLCV, RSIStrategyParams } from '@shared/interfaces/trading.interface';
import { logger } from '@infrastructure/logger';
import ccxt, { Exchange } from 'ccxt';

export class SimpleRSIStrategy {
  private params: RSIStrategyParams;
  private botId: string;

  constructor(botId = 'default-bot') {
    this.botId = botId;
    // Parameter default, nanti akan dimuat dari konfigurasi
    this.params = {
      rsiPeriod: 14,
      overboughtThreshold: 70,
      oversoldThreshold: 30,
      timeframe: '1h',
    };
    this.validateParams();
  }

  private validateParams(): void {
    if (!this.params.rsiPeriod || this.params.rsiPeriod < 2) {
      throw new Error('RSI period must be at least 2');
    }
    logger.info(`RSI Strategy initialized for bot ${this.botId}`, {
      botId: this.botId,
      params: this.params,
    });
  }

  public async generateSignal(exchange: Exchange, symbol: string): Promise<StrategySignal> {
    try {
      logger.info(`Generating RSI signal for ${symbol}`, { botId: this.botId, symbol });
      const ohlcvData = await this.fetchOHLCVData(exchange, symbol);

      if (ohlcvData.length < this.params.rsiPeriod) {
        logger.warn(`Insufficient data for RSI calculation. Need ${this.params.rsiPeriod}, got ${ohlcvData.length}`);
        return { action: 'HOLD', confidence: 0, reason: 'Insufficient data', timestamp: new Date() };
      }

      const closePrices = ohlcvData.map(c => c.close);
      const rsiValues = RSI.calculate({ values: closePrices, period: this.params.rsiPeriod });
      const currentRSI = rsiValues[rsiValues.length - 1];

      return this.analyzeRSI(currentRSI);
    } catch (error) {
      logger.error(`Failed to generate RSI signal for ${symbol}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { action: 'HOLD', confidence: 0, reason: `Error: ${errorMessage}`, timestamp: new Date() };
    }
  }

  private async fetchOHLCVData(exchange: Exchange, symbol: string): Promise<OHLCV[]> {
    const limit = this.params.rsiPeriod * 2;
    const ohlcvRaw = await exchange.fetchOHLCV(symbol, this.params.timeframe, undefined, limit);
    return ohlcvRaw.map((c: any) => ({ timestamp: c[0], open: c[1], high: c[2], low: c[3], close: c[4], volume: c[5] }));
  }

  private analyzeRSI(currentRSI: number): StrategySignal {
    if (currentRSI <= this.params.oversoldThreshold) {
      return { action: 'BUY', confidence: 0.75, reason: `RSI oversold (${currentRSI.toFixed(2)})`, timestamp: new Date(), metadata: { rsi: currentRSI } };
    }
    if (currentRSI >= this.params.overboughtThreshold) {
      return { action: 'SELL', confidence: 0.75, reason: `RSI overbought (${currentRSI.toFixed(2)})`, timestamp: new Date(), metadata: { rsi: currentRSI } };
    }
    return { action: 'HOLD', confidence: 0.5, reason: `RSI neutral (${currentRSI.toFixed(2)})`, timestamp: new Date(), metadata: { rsi: currentRSI } };
  }
}
