// src/container.ts (Update)
import TradingService from '@modules/trading/trading.service';
import ConfigurationService from '@modules/configuration/configuration.service';
import { ConfigurationRepository } from '@infrastructure/repositories/configuration.repository';
import { BotService } from '@core/services/bot.service';
import { logger } from '@infrastructure/logger';
import { TradeLogRepository } from '@infrastructure/repositories/trade-log.repository';
import { BalanceService } from '@core/services/balance.service';
import { TelegramService } from '@core/services/telegram.service';
import { PnlService } from '@core/services/pnl.service';
import { OpenPositionRepository } from '@infrastructure/repositories/open-position.repository';
import { StrategyManager } from '@core/services/strategy.manager';
import { BotConfig } from '@shared/interfaces/trading.interface';

// --- Variabel Global untuk Dependensi ---
// [DIPERBAIKI] Tambahkan 'export' agar bisa diimpor oleh file lain.
let strategyManager: StrategyManager;
export let tradingService: TradingService;
export let configurationService: ConfigurationService;
export let botService: BotService;

// --- Repositories & Service tanpa dependensi kompleks ---
export const configurationRepository = new ConfigurationRepository();
export const tradeLogRepository = new TradeLogRepository();
export const openPositionRepository = new OpenPositionRepository();
export const balanceService = new BalanceService();
export const telegramService = new TelegramService();
export const pnlService = new PnlService(tradeLogRepository);

/**
 * Fungsi inisialisasi utama.
 * Perlu async karena kita harus membaca konfigurasi awal dari DB
 * sebelum membuat instance StrategyManager.
 */
async function initializeContainer() {
  try {
    logger.info('Initializing dependency container...');
    
    // 1. Baca konfigurasi awal dari DB
    const initialConfig: BotConfig = await configurationRepository.readConfig();
    
    // 2. Buat Strategy Manager dengan konfigurasi awal
    strategyManager = new StrategyManager(initialConfig);
    
    // 3. Buat service lain yang bergantung pada Strategy Manager
    tradingService = new TradingService(strategyManager);
    configurationService = new ConfigurationService(
        strategyManager, 
        configurationRepository,
        telegramService
    );
    
    // 4. Buat Bot Service dengan semua dependensinya
    botService = new BotService(
      tradingService,
      configurationService,
      tradeLogRepository,
      openPositionRepository,
      telegramService
    );
    
    logger.info('Dependency container initialized successfully.');

  } catch (error) {
    logger.error('FATAL: Could not initialize dependency container.', error);
    process.exit(1);
  }
}

// Ekspor promise inisialisasi agar server bisa menunggunya
export const containerReady = initializeContainer();
