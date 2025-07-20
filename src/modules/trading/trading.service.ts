import ccxt, { Exchange } from 'ccxt';
import { StrategySignal } from '@shared/interfaces/trading.interface';
import { logger } from '@infrastructure/logger';
import config from '@config/index';
import { StrategyManager } from '@core/services/strategy.manager'; 

class TradingService {
  private exchange: Exchange;

  // [DIPERBAIKI] Constructor sekarang menerima StrategyManager
  constructor(private strategyManager: StrategyManager) {
    const exchangeOptions = {
      apiKey: config.isTestnet ? config.binanceTestnet.apiKey : config.binance.apiKey,
      secret: config.isTestnet ? config.binanceTestnet.apiSecret : config.binance.apiSecret,
    };
    this.exchange = new ccxt.binance(exchangeOptions);
    if (config.isTestnet) this.exchange.setSandboxMode(true);
  }

  public async getTradingSignal(symbol: string): Promise<StrategySignal> {
    // Dapatkan strategi yang aktif dari manager
    const activeStrategy = this.strategyManager.getActiveStrategy();
    logger.info(`[Service] Generating signal for ${symbol} using ${activeStrategy.constructor.name}`);
    const signal = await activeStrategy.generateSignal(this.exchange, symbol);
    return signal;
  }

  public async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const ticker = await this.exchange.fetchTicker(symbol);
      if (!ticker.last) throw new Error(`Could not fetch last price for ${symbol}`);
      return ticker.last;
    } catch (error) {
      logger.error(`Failed to fetch current price for ${symbol}:`, error);
      throw error;
    }
  }
}

export default TradingService;