import { logger } from '@infrastructure/logger';
import TradingService from '@modules/trading/trading.service';
import { TradeLogRepository } from '@infrastructure/repositories/trade-log.repository';
import { TelegramService } from './telegram.service';
import ConfigurationService from '@modules/configuration/configuration.service';

const TICK_INTERVAL = 15000;

// Interface untuk menyimpan state posisi yang terbuka
interface OpenPosition {
  symbol: string;
  entryPrice: number;
  quantity: number;
  timestamp: Date;
}

export class BotService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  // [BARU] State untuk menyimpan posisi yang sedang terbuka
  private currentPosition: OpenPosition | null = null;

  constructor(
    private tradingService: TradingService,
    private configService: ConfigurationService,
    private tradeLogRepo: TradeLogRepository,
    private telegramService: TelegramService
  ) {}

  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Bot is already running.');
      return;
    }
    logger.info('Starting bot...');
    this.isRunning = true;
    // Saat start, pastikan tidak ada posisi terbuka
    this.currentPosition = null; 
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
    return {
      isRunning: this.isRunning,
      tickInterval: TICK_INTERVAL,
      currentPosition: this.currentPosition,
    };
  }

  private runTick = async (): Promise<void> => {
    logger.info('--- Bot Tick Running ---');
    try {
      const currentConfig = await this.configService.getCurrentConfig();
      const symbol = currentConfig.tradingSymbol;

      if (!symbol) {
        logger.warn('[TICK] Trading symbol is not set. Skipping tick.');
        return;
      }

      // --- LOGIKA JIKA SEDANG MEMILIKI POSISI ---
      if (this.currentPosition) {
        const currentPrice = await this.tradingService.getCurrentPrice(symbol);
        const pnl = (currentPrice - this.currentPosition.entryPrice) * this.currentPosition.quantity;
        const pnlPercentage = (pnl / (this.currentPosition.entryPrice * this.currentPosition.quantity)) * 100;

        logger.info(`[POSITION] Holding ${symbol}. Entry: ${this.currentPosition.entryPrice}, Current: ${currentPrice}, PnL: ${pnl.toFixed(4)} (${pnlPercentage.toFixed(2)}%)`);

        const signal = await this.tradingService.getTradingSignal(symbol);
        if (signal.action === 'SELL') {
          logger.info(`[EXECUTION] SELL signal received for open position. Closing position...`);
          
          const tradeData = {
            symbol: symbol,
            action: signal.action,
            reason: signal.reason,
            price: currentPrice, // Gunakan harga saat ini untuk simulasi
            quantity: this.currentPosition.quantity,
          };
          
          await this.tradeLogRepo.createLog(tradeData);
          
          const emoji = '🔴';
          const message = `${emoji} *SELL Executed* \n\n*Symbol:* ${symbol}\n*Price:* ${currentPrice}\n*Reason:* ${signal.reason}\n*Realized PnL:* ${pnl.toFixed(4)}`;
          await this.telegramService.sendMessage(message);

          // [PENTING] Kosongkan posisi setelah menjual
          this.currentPosition = null;
        }
      } 
      // --- LOGIKA JIKA TIDAK MEMILIKI POSISI ---
      else {
        logger.info(`[IDLE] Waiting for BUY signal for ${symbol}...`);

        // Hanya cari sinyal BUY jika tidak punya posisi
        const signal = await this.tradingService.getTradingSignal(symbol);
        if (signal.action === 'BUY') {
          const entryPrice = await this.tradingService.getCurrentPrice(symbol);
          const quantity = 1; // Kuantitas simulasi

          logger.info(`[EXECUTION] BUY signal received. Opening new position for ${symbol} at ${entryPrice}`);

          // [PENTING] Set posisi saat ini setelah membeli
          this.currentPosition = {
            symbol,
            entryPrice,
            quantity,
            timestamp: new Date(),
          };

          const tradeData = {
            symbol: symbol,
            action: signal.action,
            reason: signal.reason,
            price: entryPrice,
            quantity: quantity,
          };
          
          await this.tradeLogRepo.createLog(tradeData);

          const emoji = '🟢';
          const message = `${emoji} *BUY Executed* \n\n*Symbol:* ${symbol}\n*Price:* ${entryPrice}\n*Reason:* ${signal.reason}`;
          await this.telegramService.sendMessage(message);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in tick';
      logger.error(`[TICK] An error occurred: ${errorMessage}`);
      await this.telegramService.sendMessage(`❌ *An Error Occurred*\n\n${errorMessage}`);
    }
  };
}