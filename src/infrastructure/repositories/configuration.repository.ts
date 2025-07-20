import { PrismaClient } from '@prisma/client';
import { RSIStrategyParams } from '@shared/interfaces/trading.interface';
import { logger } from '@infrastructure/logger';

// Konfigurasi default jika database kosong.
const defaultConfig: RSIStrategyParams = {
  rsiPeriod: 14,
  overboughtThreshold: 70,
  oversoldThreshold: 30,
  timeframe: '1h',
};

// ID statis untuk satu-satunya baris konfigurasi di database.
const CONFIG_ID = 'main_config';

export class ConfigurationRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Membaca konfigurasi dari database.
   * Jika tidak ada, akan membuat entri baru dengan nilai default.
   */
  public async readConfig(): Promise<RSIStrategyParams> {
    try {
      let config = await this.prisma.configuration.findUnique({
        where: { id: CONFIG_ID },
      });

      // Jika tidak ada konfigurasi di DB, buat satu.
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
      // Kembalikan hanya parameter yang relevan.
      return {
        rsiPeriod: config.rsiPeriod,
        overboughtThreshold: config.overboughtThreshold,
        oversoldThreshold: config.oversoldThreshold,
        timeframe: config.timeframe,
      };
    } catch (error) {
      logger.error('Failed to read config from database:', error);
      throw error;
    }
  }

  /**
   * Menulis (memperbarui atau membuat) konfigurasi ke database.
   * @param config - Objek konfigurasi yang akan disimpan.
   */
  public async writeConfig(config: RSIStrategyParams): Promise<void> {
    try {
      // Gunakan 'upsert' untuk memperbarui jika ada, atau membuat jika tidak ada.
      await this.prisma.configuration.upsert({
        where: { id: CONFIG_ID },
        update: {
          ...config,
        },
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
