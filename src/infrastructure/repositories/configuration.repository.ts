import { PrismaClient } from '@prisma/client';
import { RSIStrategyParams } from '@shared/interfaces/trading.interface';
import { logger } from '@infrastructure/logger';

// [DIPERBAIKI] Tambahkan parameter manajemen risiko ke konfigurasi default
const defaultConfig: RSIStrategyParams = {
  tradingSymbol: 'BTC/USDT',
  rsiPeriod: 14,
  overboughtThreshold: 70,
  oversoldThreshold: 30,
  timeframe: '1h',
  stopLossPercentage: 0, // Tidak aktif secara default
  takeProfitPercentage: 0, // Tidak aktif secara default
};

const CONFIG_ID = 'main_config';

export class ConfigurationRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public async readConfig(): Promise<RSIStrategyParams> {
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
      // [DIPERBAIKI] Kembalikan semua parameter
      return {
        tradingSymbol: config.tradingSymbol,
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

  public async writeConfig(config: RSIStrategyParams): Promise<void> {
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