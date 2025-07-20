import { logger } from '@infrastructure/logger';
import TradingService from '@modules/trading/trading.service';
import { TradeLogRepository } from '@infrastructure/repositories/trade-log.repository';
import { TelegramService } from './telegram.service'; // Baru

const TICK_INTERVAL = 15000;

export class BotService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(
    private tradingService: TradingService,
    private tradeLogRepo: TradeLogRepository,
    private telegramService: TelegramService // Baru
  ) {}

  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Bot is already running.');
      return;
    }
    logger.info('Starting bot...');
    this.isRunning = true;
    await this.telegramService.sendMessage('✅ *Bot Started*\nBot is now running and monitoring the market.');
    this.runTick();
    this.intervalId = setInterval(this.runTick, TICK_INTERVAL);
    logger.info(`Bot started. Tick interval: ${TICK_INTERVAL / 1000} seconds.`);
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Bot is not running.');
      return;
    }
    logger.info('Stopping bot...');
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    await this.telegramService.sendMessage('🛑 *Bot Stopped*\nBot has been stopped manually.');
    logger.info('Bot stopped.');
  }

  public getStatus() {
    return { isRunning: this.isRunning, tickInterval: TICK_INTERVAL };
  }

  private runTick = async (): Promise<void> => {
    logger.info('--- Bot Tick Running ---');
    try {
      const symbol = 'BTC/USDT';
      const signal = await this.tradingService.getTradingSignal(symbol);

      logger.info(`[TICK] Signal for ${symbol}: ${signal.action} | Reason: ${signal.reason}`);

      if (signal.action === 'BUY' || signal.action === 'SELL') {
        logger.info(`[TRADE EXECUTION] Action: ${signal.action} for ${symbol}. (Simulation)`);
        
        const tradeData = {
          symbol: symbol,
          action: signal.action,
          reason: signal.reason,
          price: signal.metadata.rsi,
          quantity: 1,
        };
        
        await this.tradeLogRepo.createLog(tradeData);
        
        // Kirim notifikasi Telegram
        const emoji = signal.action === 'BUY' ? '🟢' : '🔴';
        const message = `${emoji} *${signal.action} Signal Executed* \n\n*Symbol:* ${symbol}\n*Reason:* ${signal.reason}`;
        await this.telegramService.sendMessage(message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in tick';
      logger.error(`[TICK] An error occurred: ${errorMessage}`);
      // Kirim notifikasi error ke Telegram
      await this.telegramService.sendMessage(`❌ *An Error Occurred*\n\n${errorMessage}`);
    }
  };
}