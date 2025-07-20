import { SimpleRSIStrategy } from '@core/strategies/simple-rsi.strategy';
import { RSIStrategyParams } from '@shared/interfaces/trading.interface';
import { UpdateConfigurationDto } from './configuration.dto';
import { ConfigurationRepository } from '@infrastructure/repositories/configuration.repository';

class ConfigurationService {
  private rsiStrategy: SimpleRSIStrategy;
  private repository: ConfigurationRepository;

  // [DIPERBAIKI] Constructor sekarang menerima repository sebagai argumen kedua
  constructor(rsiStrategy: SimpleRSIStrategy, repository: ConfigurationRepository) {
    this.rsiStrategy = rsiStrategy;
    this.repository = repository;
  }

  /**
   * Mengambil konfigurasi dari file melalui repository.
   */
  public async getCurrentConfig(): Promise<RSIStrategyParams> {
    return this.repository.readConfig();
  }

  /**
   * Memperbarui konfigurasi pada strategi dan menyimpannya ke file.
   */
  public async updateConfig(newConfig: UpdateConfigurationDto): Promise<RSIStrategyParams> {
    // 1. Dapatkan konfigurasi saat ini dari DB
    const currentConfig = await this.repository.readConfig();
    
    // 2. Gabungkan dengan perubahan baru
    const updatedConfig = { ...currentConfig, ...newConfig };

    // 3. Perbarui state di dalam memori (strategi)
    this.rsiStrategy.updateParams(updatedConfig);
    
    // 4. Simpan konfigurasi baru ke DB
    await this.repository.writeConfig(updatedConfig);
    
    return updatedConfig;
  }
}

export default ConfigurationService;