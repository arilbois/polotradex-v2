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
import { OrderService } from '@core/services/order.service';
import { EmergencyService } from '@core/services/emergency.service';
import { BacktestService } from '@core/services/backtest.service';

// --- Variabel Global untuk Dependensi ---
let strategyManager: StrategyManager;
export let tradingService: TradingService;
export let configurationService: ConfigurationService;
export let botService: BotService;
export let emergencyService: EmergencyService;
export let backtestService: BacktestService; // [DIPERBAIKI] Tambahkan export

// --- Repositories & Service tanpa dependensi kompleks ---
export const configurationRepository = new ConfigurationRepository();
export const tradeLogRepository = new TradeLogRepository();
export const openPositionRepository = new OpenPositionRepository();
export const balanceService = new BalanceService();
export const telegramService = new TelegramService();
export const pnlService = new PnlService(tradeLogRepository);
export const orderService = new OrderService();

/**
 * Fungsi inisialisasi utama.
 */
async function initializeContainer() {
  try {
    logger.info('Initializing dependency container...');
    
    const initialConfig: BotConfig = await configurationRepository.readConfig();
    
    strategyManager = new StrategyManager(initialConfig);
    
    tradingService = new TradingService(strategyManager);
    
    configurationService = new ConfigurationService(
      strategyManager, 
      configurationRepository,
      telegramService
    );
    
    botService = new BotService(
      tradingService,
      configurationService,
      tradeLogRepository,
      openPositionRepository,
      orderService,
      balanceService,
      telegramService
    );

    emergencyService = new EmergencyService(botService, orderService, configurationRepository, openPositionRepository, balanceService);
    
    backtestService = new BacktestService(strategyManager, configurationRepository);
    
    logger.info('Dependency container initialized successfully.');

  } catch (error) {
    logger.error('FATAL: Could not initialize dependency container.', error);
    process.exit(1);
  }
}

export const containerReady = initializeContainer();
