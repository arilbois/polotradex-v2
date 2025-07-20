import { IStrategy } from './IStrategy';
import { SimpleRSIStrategy } from './simple-rsi.strategy';
import { logger } from '@infrastructure/logger';

// Peta yang berisi semua strategi yang tersedia di aplikasi.
// Kunci adalah nama strategi (string), dan nilai adalah kelasnya.
const strategies: { [key: string]: new () => IStrategy } = {
  RSI: SimpleRSIStrategy,
  // Di masa depan, Anda bisa menambahkan strategi baru di sini:
  // MACD: MACDStrategy,
};

/**
 * Factory (pabrik) yang bertanggung jawab untuk membuat instance
 * dari sebuah strategi berdasarkan namanya.
 */
export class StrategyFactory {
  public static createStrategy(name: string): IStrategy {
    const StrategyClass = strategies[name];

    if (!StrategyClass) {
      logger.error(`Strategy "${name}" not found. Defaulting to RSI.`);
      return new SimpleRSIStrategy();
    }

    logger.info(`Creating new instance of strategy: ${name}`);
    return new StrategyClass();
  }
}