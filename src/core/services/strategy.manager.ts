import { IStrategy } from '@core/strategies/IStrategy';
import { StrategyFactory } from '@core/strategies/strategy.factory';
import { BotConfig } from '@shared/interfaces/trading.interface';
import { logger } from '@infrastructure/logger';

/**
 * Service yang bertanggung jawab untuk mengelola instance strategi yang aktif.
 * Ini adalah singleton yang memastikan seluruh aplikasi menggunakan
 * instance strategi yang sama dan ter-update.
 */
export class StrategyManager {
  private activeStrategy: IStrategy;
  private activeStrategyName: string;

  constructor(initialConfig: BotConfig) {
    // Simpan nama singkatan dari konfigurasi awal
    this.activeStrategyName = initialConfig.strategyName;
    logger.info(`[StrategyManager] Initializing with strategy: "${this.activeStrategyName}"`);
    
    // Buat strategi awal
    this.activeStrategy = StrategyFactory.createStrategy(this.activeStrategyName);
    this.activeStrategy.updateParams(initialConfig);
    
    logger.info(`[StrategyManager] Strategy initialized: ${this.activeStrategy.constructor.name}`);
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
  public updateActiveStrategy(newConfig: BotConfig): void {
    // [DIPERBAIKI] Logika perbandingan yang lebih andal dengan logging tambahan
    logger.info(`[StrategyManager] Checking for strategy update. Current: "${this.activeStrategyName}", New: "${newConfig.strategyName}"`);

    if (this.activeStrategyName !== newConfig.strategyName) {
      logger.info(`[StrategyManager] Strategy has changed. Attempting to create new instance for "${newConfig.strategyName}".`);
      
      // Buat instance strategi baru dari pabrik
      this.activeStrategy = StrategyFactory.createStrategy(newConfig.strategyName);
      
      // Perbarui nama singkatan yang tersimpan
      this.activeStrategyName = newConfig.strategyName;

      logger.info(`[StrategyManager] New strategy instance created: ${this.activeStrategy.constructor.name}`);
    } else {
      logger.info(`[StrategyManager] Strategy name has not changed. Updating parameters only.`);
    }
    
    // Selalu perbarui parameter dari strategi yang aktif (baik yang lama maupun yang baru).
    this.activeStrategy.updateParams(newConfig);
  }
}
