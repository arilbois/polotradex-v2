import { SimpleRSIStrategy } from '@core/strategies/simple-rsi.strategy';
import { RSIStrategyParams } from '@shared/interfaces/trading.interface';
import { UpdateConfigurationDto } from './configuration.dto';

// !! PENTING: Untuk sementara, kita buat state di sini.
// Ini BUKAN praktik terbaik untuk produksi karena state tidak akan tersinkronisasi
// jika aplikasi memiliki beberapa instance. Di fase selanjutnya, kita akan memindahkan
// state ini ke database (seperti Redis atau file JSON) agar persisten.
// Untuk tujuan belajar, pendekatan ini sudah cukup.

// "Singleton" manual untuk menyimpan instance strategi
let rsiStrategyInstance: SimpleRSIStrategy | null = null;

const getRsiStrategyInstance = () => {
  if (!rsiStrategyInstance) {
    rsiStrategyInstance = new SimpleRSIStrategy();
  }
  return rsiStrategyInstance;
};


class ConfigurationService {
  private rsiStrategy: SimpleRSIStrategy;

  constructor() {
    this.rsiStrategy = getRsiStrategyInstance();
  }

  public getCurrentConfig(): RSIStrategyParams {
    // Kita perlu menambahkan method getParams() di SimpleRSIStrategy
    // Untuk sekarang, kita akan mock data ini.
    return {
        rsiPeriod: 14,
        overboughtThreshold: 70,
        oversoldThreshold: 30,
        timeframe: '1h',
    };
  }

  public updateConfig(newConfig: UpdateConfigurationDto): RSIStrategyParams {
    // Kita perlu menambahkan method updateParams() di SimpleRSIStrategy
    // Untuk sekarang, kita hanya log saja
    console.log('Updating config with:', newConfig);
    return {
        rsiPeriod: newConfig.rsiPeriod || 14,
        overboughtThreshold: newConfig.overboughtThreshold || 70,
        oversoldThreshold: newConfig.oversoldThreshold || 30,
        timeframe: newConfig.timeframe || '1h',
    };
  }
}

export default ConfigurationService;
