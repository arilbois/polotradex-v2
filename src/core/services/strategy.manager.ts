import { IStrategy } from '@core/strategies/IStrategy';
import { StrategyFactory } from '@core/strategies/strategy.factory';
import { BotConfig } from '@shared/interfaces/trading.interface'; // Diperbarui
import { logger } from '@infrastructure/logger';

/**
 * Service yang bertanggung jawab untuk mengelola instance strategi yang aktif.
 * Ini adalah singleton yang memastikan seluruh aplikasi menggunakan
 * instance strategi yang sama dan ter-update.
 */
export class StrategyManager {
  private activeStrategy: IStrategy;

  // [DIPERBAIKI] Menggunakan BotConfig
  constructor(initialConfig: BotConfig) {
    // Buat strategi awal saat manager diinisialisasi
    this.activeStrategy = StrategyFactory.createStrategy(initialConfig.strategyName);
    this.activeStrategy.updateParams(initialConfig);
  }

  /**
   * Mengembalikan instance strategi yang sedang aktif.
   */
  public getActiveStrategy(): IStrategy {
    return this.activeStrategy;
  }

  /**
   * Memperbarui strategi yang aktif. Dipanggil ketika ada perubahan
   * konfigurasi dari ConfigurationService.
   */
  // [DIPERBAIKI] Menggunakan BotConfig
  public updateActiveStrategy(newConfig: BotConfig): void {
    const currentStrategyName = this.activeStrategy.constructor.name;
    const newStrategyName = newConfig.strategyName === 'RSI' ? 'SimpleRSIStrategy' : newConfig.strategyName;

    // Jika nama strategi berubah, buat instance baru.
    if (!currentStrategyName.includes(newStrategyName)) {
      logger.info(`Strategy changed from ${currentStrategyName} to ${newConfig.strategyName}. Creating new instance.`);
      this.activeStrategy = StrategyFactory.createStrategy(newConfig.strategyName);
    }
    
    // Selalu perbarui parameter dari strategi yang aktif.
    this.activeStrategy.updateParams(newConfig);
  }
}
