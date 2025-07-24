import { IStrategy } from './IStrategy';
import { SimpleRSIStrategy } from './simple-rsi.strategy';
import { MACDStrategy } from './macd.strategy'; 
import { SupportResistanceStrategy } from './support-resistance.strategy';
import { logger } from '@infrastructure/logger';

// [DIPERBAIKI] Daftarkan strategi MACD yang baru
const strategies: { [key: string]: new () => IStrategy } = {
  RSI: SimpleRSIStrategy,
  MACD: MACDStrategy,
  SR: SupportResistanceStrategy,
  'SupportResistance': SupportResistanceStrategy, // Tambahkan alias alternatif
};

export class StrategyFactory {
  public static createStrategy(name: string): IStrategy {
    logger.info(`[StrategyFactory] Attempting to create strategy: "${name}"`);
    logger.info(`[StrategyFactory] Available strategies: ${Object.keys(strategies).join(', ')}`);
    
    const StrategyClass = strategies[name];

    if (!StrategyClass) {
      logger.error(`Strategy "${name}" not found. Defaulting to RSI.`);
      logger.error(`[StrategyFactory] Available strategies: ${Object.keys(strategies).join(', ')}`);
      return new SimpleRSIStrategy();
    }

    logger.info(`Creating new instance of strategy: ${name}`);
    return new StrategyClass();
  }
}