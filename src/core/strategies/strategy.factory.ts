import { IStrategy } from './IStrategy';
import { SimpleRSIStrategy } from './simple-rsi.strategy';
import { MACDStrategy } from './macd.strategy'; // Baru
import { logger } from '@infrastructure/logger';

// [DIPERBAIKI] Daftarkan strategi MACD yang baru
const strategies: { [key: string]: new () => IStrategy } = {
  RSI: SimpleRSIStrategy,
  MACD: MACDStrategy, // Baru
};

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