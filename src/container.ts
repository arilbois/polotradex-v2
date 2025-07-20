/**
 * src/container.ts
 * * File ini berfungsi sebagai "wadah" Dependency Injection (DI) sederhana.
 * Semua service dan dependensi yang perlu dibagikan (shared) di seluruh aplikasi
 * akan diinisialisasi di sini untuk memastikan hanya ada satu instance (singleton).
 */

import { SimpleRSIStrategy } from '@core/strategies/simple-rsi.strategy';
import TradingService from '@modules/trading/trading.service';
import ConfigurationService from '@modules/configuration/configuration.service';

// 1. Inisialisasi dependensi yang akan dibagikan.
// Instance ini akan digunakan oleh service lain.
export const rsiStrategy = new SimpleRSIStrategy();

// 2. Inisialisasi service dengan menyuntikkan (injecting) dependensi.
// Kedua service di bawah ini sekarang menggunakan instance rsiStrategy yang SAMA.
export const tradingService = new TradingService(rsiStrategy);
export const configurationService = new ConfigurationService(rsiStrategy);
