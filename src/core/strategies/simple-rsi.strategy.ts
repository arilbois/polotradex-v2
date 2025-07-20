// src/core/strategies/simple-rsi.strategy.ts
import { RSI } from 'technicalindicators';
import ccxt, { Exchange } from 'ccxt';
import { StrategySignal, OHLCV, RSIStrategyParams } from '@shared/interfaces/trading.interface';
import { logger } from '@infrastructure/logger';
import { UpdateConfigurationDto } from '@modules/configuration/configuration.dto';

export class SimpleRSIStrategy {
  private params: RSIStrategyParams;
  private botId: string;

  constructor(botId = 'default-bot') {
    this.botId = botId;
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
    logger.info(`RSI Strategy parameters validated for bot ${this.botId}`, {
      botId: this.botId,
      params: this.params,
    });
  }

  public async generateSignal(exchange: Exchange, symbol: string): Promise<StrategySignal> {
    try {
      logger.info(`Generating RSI signal for ${symbol}`, { botId: this.botId, symbol, params: this.params });
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
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      logger.error(`Failed to generate RSI signal for ${symbol}:`, error);
      return { action: 'HOLD', confidence: 0, reason: `Error: ${errorMessage}`, timestamp: new Date() };
    }
  }

  private async fetchOHLCVData(exchange: Exchange, symbol: string): Promise<OHLCV[]> {
    const limit = this.params.rsiPeriod * 2;
    const ohlcvRaw = await exchange.fetchOHLCV(symbol, this.params.timeframe, undefined, limit);

    return ohlcvRaw
      .filter(candle =>
        candle.every(val => typeof val === 'number')
      )
      .map(candle => ({
        timestamp: candle[0] as number,
        open: candle[1] as number,
        high: candle[2] as number,
        low: candle[3] as number,
        close: candle[4] as number,
        volume: candle[5] as number,
      }));
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

  public getParams(): RSIStrategyParams {
    return { ...this.params };
  }

  public updateParams(newParams: Partial<RSIStrategyParams>): void {
    this.params = { ...this.params, ...newParams };
    this.validateParams(); 
    
    logger.info(`Updated RSI strategy parameters for bot ${this.botId}`, {
      botId: this.botId,
      newParams: this.params,
    });
  }
}