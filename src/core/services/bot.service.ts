import { logger } from '@infrastructure/logger';
import TradingService from '@modules/trading/trading.service';

const TICK_INTERVAL = 15000; // Jalankan setiap 15 detik untuk testing

export class BotService {
  private tradingService: TradingService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(tradingService: TradingService) {
    this.tradingService = tradingService;
  }

  public start(): void {
    if (this.isRunning) {
      logger.warn('Bot is already running.');
      return;
    }

    logger.info('Starting bot...');
    this.isRunning = true;
    // Jalankan tick pertama segera, lalu set interval
    this.runTick();
    this.intervalId = setInterval(this.runTick, TICK_INTERVAL);
    logger.info(`Bot started. Tick interval: ${TICK_INTERVAL / 1000} seconds.`);
  }

  public stop(): void {
    if (!this.isRunning) {
      logger.warn('Bot is not running.');
      return;
    }

    logger.info('Stopping bot...');
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = null;
    this.isRunning = false;
    logger.info('Bot stopped.');
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      tickInterval: TICK_INTERVAL,
    };
  }

  // Gunakan arrow function untuk memastikan 'this' merujuk ke instance BotService
  private runTick = async (): Promise<void> => {
    logger.info('--- Bot Tick Running ---');
    try {
      // Di masa depan, simbol bisa diambil dari konfigurasi
      const symbol = 'BTC/USDT';
      const signal = await this.tradingService.getTradingSignal(symbol);

      logger.info(`[TICK] Signal for ${symbol}: ${signal.action} | Reason: ${signal.reason}`);

      // Di sini adalah tempat untuk logika eksekusi trade
      if (signal.action === 'BUY' || signal.action === 'SELL') {
        logger.info(`[TRADE EXECUTION] Action: ${signal.action} for ${symbol}. (Simulation)`);
        // Contoh: await this.tradingService.placeOrder(symbol, signal.action, amount);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in tick';
      logger.error(`[TICK] An error occurred: ${errorMessage}`);
    }
  };
}
