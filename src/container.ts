import { SimpleRSIStrategy } from '@core/strategies/simple-rsi.strategy';
import TradingService from '@modules/trading/trading.service';
import ConfigurationService from '@modules/configuration/configuration.service';
import { ConfigurationRepository } from '@infrastructure/repositories/configuration.repository';
import { BotService } from '@core/services/bot.service';
import { logger } from '@infrastructure/logger';
import { TradeLogRepository } from '@infrastructure/repositories/trade-log.repository';
import { BalanceService } from '@core/services/balance.service';
import { TelegramService } from '@core/services/telegram.service'; // Baru

// --- Inisialisasi ---

export const configurationRepository = new ConfigurationRepository();
export const tradeLogRepository = new TradeLogRepository();

export const rsiStrategy = new SimpleRSIStrategy();
export const balanceService = new BalanceService();
export const telegramService = new TelegramService(); // Baru

export const tradingService = new TradingService(rsiStrategy);
export const configurationService = new ConfigurationService(rsiStrategy, configurationRepository);
// [DIPERBAIKI] Berikan dependensi baru ke BotService
export const botService = new BotService(tradingService, tradeLogRepository, telegramService);


// --- Sinkronisasi Konfigurasi Awal ---
async function syncInitialConfig() {
  try {
    logger.info('Syncing initial configuration from database...');
    const initialConfig = await configurationRepository.readConfig();
    rsiStrategy.updateParams(initialConfig);
    logger.info('Initial configuration synced successfully.');
  } catch (error) {
    logger.error('FATAL: Could not sync initial configuration.', error);
    process.exit(1);
  }
}

syncInitialConfig();
