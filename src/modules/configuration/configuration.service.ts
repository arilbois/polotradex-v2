import { SimpleRSIStrategy } from '@core/strategies/simple-rsi.strategy';
import { RSIStrategyParams } from '@shared/interfaces/trading.interface';
import { UpdateConfigurationDto } from './configuration.dto';

class ConfigurationService {
  private rsiStrategy: SimpleRSIStrategy;

  // Terima strategi melalui constructor
  constructor(rsiStrategy: SimpleRSIStrategy) {
    this.rsiStrategy = rsiStrategy;
  }

  /**
   * [DIPERBAIKI] Mengambil konfigurasi langsung dari instance strategi.
   * Tidak ada lagi data hardcode.
   */
  public getCurrentConfig(): RSIStrategyParams {
    return this.rsiStrategy.getParams();
  }

  /**
   * [DIPERBAIKI] Memperbarui konfigurasi pada instance strategi yang sama.
   * Sekarang benar-benar memanggil metode updateParams.
   */
  public updateConfig(newConfig: UpdateConfigurationDto): RSIStrategyParams {
    this.rsiStrategy.updateParams(newConfig);
    return this.rsiStrategy.getParams();
  }
}
export default ConfigurationService;