import { PrismaClient } from '@prisma/client';
import { BotConfig } from '@shared/interfaces/trading.interface'; // Diperbarui
import { logger } from '@infrastructure/logger';

// [DIPERBAIKI] Menggunakan BotConfig dan menambahkan default untuk strategyName
const defaultConfig: BotConfig = {
  tradingSymbol: 'BTC/USDT',
  strategyName: 'RSI',
  rsiPeriod: 14,
  overboughtThreshold: 70,
  oversoldThreshold: 30,
  timeframe: '1h',
  stopLossPercentage: 0,
  takeProfitPercentage: 0,
};

const CONFIG_ID = 'main_config';

export class ConfigurationRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // [DIPERBAIKI] Menggunakan BotConfig
  public async readConfig(): Promise<BotConfig> {
    try {
      let config = await this.prisma.configuration.findUnique({
        where: { id: CONFIG_ID },
      });

      if (!config) {
        logger.warn('No configuration found in DB, creating with default values.');
        config = await this.prisma.configuration.create({
          data: {
            id: CONFIG_ID,
            ...defaultConfig,
          },
        });
      }

      logger.info('Configuration loaded from database.');
      // Kembalikan semua parameter sebagai BotConfig
      return {
        tradingSymbol: config.tradingSymbol,
        strategyName: config.strategyName,
        rsiPeriod: config.rsiPeriod,
        overboughtThreshold: config.overboughtThreshold,
        oversoldThreshold: config.oversoldThreshold,
        timeframe: config.timeframe,
        stopLossPercentage: config.stopLossPercentage,
        takeProfitPercentage: config.takeProfitPercentage,
      };
    } catch (error) {
      logger.error('Failed to read config from database:', error);
      throw error;
    }
  }

  // [DIPERBAIKI] Menggunakan BotConfig
  public async writeConfig(config: BotConfig): Promise<void> {
    try {
      await this.prisma.configuration.upsert({
        where: { id: CONFIG_ID },
        update: config,
        create: {
          id: CONFIG_ID,
          ...config,
        },
      });
      logger.info('Configuration saved to database.');
    } catch (error) {
      logger.error('Failed to write config to database:', error);
      throw error;
    }
  }
}