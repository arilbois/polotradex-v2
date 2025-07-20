import ccxt, { Exchange } from 'ccxt';
import { SimpleRSIStrategy } from '@core/strategies/simple-rsi.strategy';
import { StrategySignal } from '@shared/interfaces/trading.interface';
import { logger } from '@infrastructure/logger';
import config from '@config/index';

class TradingService {
  private rsiStrategy: SimpleRSIStrategy;
  private exchange: Exchange;

  constructor(rsiStrategy: SimpleRSIStrategy) {
    this.rsiStrategy = rsiStrategy;
    const exchangeOptions = {
      apiKey: config.isTestnet ? config.binanceTestnet.apiKey : config.binance.apiKey,
      secret: config.isTestnet ? config.binanceTestnet.apiSecret : config.binance.apiSecret,
    };
    this.exchange = new ccxt.binance(exchangeOptions);
    if (config.isTestnet) this.exchange.setSandboxMode(true);
  }

  public async getTradingSignal(symbol: string): Promise<StrategySignal> {
    logger.info(`[Service] Generating signal for ${symbol}`);
    const signal = await this.rsiStrategy.generateSignal(this.exchange, symbol);
    return signal;
  }

  public async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const ticker = await this.exchange.fetchTicker(symbol);
      if (!ticker.last) {
        throw new Error(`Could not fetch last price for ${symbol}`);
      }
      return ticker.last;
    } catch (error) {
      logger.error(`Failed to fetch current price for ${symbol}:`, error);
      throw error;
    }
  }
}
export default TradingService;