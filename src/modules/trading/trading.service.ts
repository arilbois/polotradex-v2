import ccxt, { Exchange } from 'ccxt';
import { SimpleRSIStrategy } from '@core/strategies/simple-rsi.strategy';
import { StrategySignal } from '@shared/interfaces/trading.interface';
import { logger } from '@infrastructure/logger';
import config from '@config/index';

class TradingService {
  private rsiStrategy: SimpleRSIStrategy;
  private exchange: Exchange;

   constructor() {
    this.rsiStrategy = new SimpleRSIStrategy();

    // Tentukan opsi untuk exchange berdasarkan konfigurasi
    const exchangeOptions = {
      apiKey: config.isTestnet ? config.binanceTestnet.apiKey : config.binance.apiKey,
      secret: config.isTestnet ? config.binanceTestnet.apiSecret : config.binance.apiSecret,
    };

    // Inisialisasi exchange dengan opsi yang sudah ditentukan
    this.exchange = new ccxt.binance(exchangeOptions);

    // Aktifkan sandbox mode jika IS_TESTNET bernilai true
    if (config.isTestnet) {
      this.exchange.setSandboxMode(true);
      logger.info('[Service] TradingService initialized in TESTNET mode.');
    } else {
      logger.info('[Service] TradingService initialized in PRODUCTION mode.');
    }
  }

  public async getTradingSignal(symbol: string): Promise<StrategySignal> {
    logger.info(`[Service] Generating signal for ${symbol}`);
    // Delegasikan pembuatan sinyal ke kelas strategi
    const signal = await this.rsiStrategy.generateSignal(this.exchange, symbol);
    return signal;
  }
}

export default TradingService;
