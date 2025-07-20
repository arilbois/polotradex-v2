/**
 * src/container.ts
 * Wadah Dependency Injection (DI) sederhana.
 */
import { SimpleRSIStrategy } from '@core/strategies/simple-rsi.strategy';
import TradingService from '@modules/trading/trading.service';
import ConfigurationService from '@modules/configuration/configuration.service';
import { ConfigurationRepository } from '@infrastructure/repositories/configuration.repository'; // [DIPERBAIKI] Diaktifkan kembali
import { BotService } from '@core/services/bot.service';
import { logger } from '@infrastructure/logger';

// --- Inisialisasi dari Bawah ke Atas ---

// 1. Repositories (Lapisan data)
export const configurationRepository = new ConfigurationRepository(); // [DIPERBAIKI] Diaktifkan kembali

// 2. Core Logic (Strategi)
export const rsiStrategy = new SimpleRSIStrategy();

// 3. Services (Menggunakan Repositories dan Strategi)
// Inisialisasi Service dengan dependensi yang dibutuhkan.
export const tradingService = new TradingService(rsiStrategy);
// [DIPERBAIKI] Berikan repository ke ConfigurationService
export const configurationService = new ConfigurationService(rsiStrategy, configurationRepository);

// Inisialisasi Bot Service dengan Trading Service
export const botService = new BotService(tradingService);


// --- Sinkronisasi Konfigurasi Awal ---
// [DIPERBAIKI] Fungsionalitas ini diaktifkan kembali
async function syncInitialConfig() {
  try {
    logger.info('Syncing initial configuration from database...');
    const initialConfig = await configurationRepository.readConfig();
    rsiStrategy.updateParams(initialConfig);
    logger.info('Initial configuration synced successfully.');
  } catch (error) {
    logger.error('FATAL: Could not sync initial configuration.', error);
    process.exit(1); // Hentikan aplikasi jika konfigurasi awal gagal dimuat
  }
}

// Jalankan sinkronisasi saat container diimpor untuk pertama kali.
syncInitialConfig();
