import { logger } from '@infrastructure/logger';
import TradingService from '@modules/trading/trading.service';
import { TradeLogRepository } from '@infrastructure/repositories/trade-log.repository';
import { TelegramService } from './telegram.service';
import ConfigurationService from '@modules/configuration/configuration.service';
import { OpenPositionRepository, PositionData } from '@infrastructure/repositories/open-position.repository';

const TICK_INTERVAL = 15000;

export class BotService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private currentPosition: PositionData | null = null;

  constructor(
    private tradingService: TradingService,
    private configService: ConfigurationService,
    private tradeLogRepo: TradeLogRepository,
    private openPositionRepo: OpenPositionRepository,
    private telegramService: TelegramService
  ) {}

  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Bot is already running.');
      return;
    }
    logger.info('Starting bot...');
    this.isRunning = true;

    this.currentPosition = await this.openPositionRepo.readPosition();
    if (this.currentPosition) {
      await this.telegramService.sendMessage(`✅ *Bot Resumed*\nFound active position for ${this.currentPosition.symbol}. Resuming monitoring.`);
    } else {
      await this.telegramService.sendMessage('✅ *Bot Started*\nBot is now running and monitoring the market.');
    }

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
  
  // Method terpusat untuk menutup posisi
  private async closePosition(currentPrice: number, reason: string) {
    if (!this.currentPosition) return;
    
    const { symbol, entryPrice, quantity } = this.currentPosition;
    const pnl = (currentPrice - entryPrice) * quantity;
    const pnlPercentage = (pnl / (entryPrice * quantity)) * 100;

    await this.tradeLogRepo.createLog({
      symbol,
      action: 'SELL',
      reason,
      price: currentPrice,
      quantity,
    });
    
    const emoji = pnl >= 0 ? '💰' : '🔻';
    const message = `${emoji} *Position Closed* \n\n*Symbol:* ${symbol}\n*Price:* ${currentPrice.toFixed(4)}\n*Reason:* ${reason}\n*Realized PnL:* ${pnl.toFixed(4)} (${pnlPercentage.toFixed(2)}%)`;
    await this.telegramService.sendMessage(message);

    await this.openPositionRepo.deletePosition();
    this.currentPosition = null;
    logger.info(`Position for ${symbol} closed. Reason: ${reason}`);
  }

  private runTick = async (): Promise<void> => {
    logger.info('--- Bot Tick Running ---');
    try {
      const currentConfig = await this.configService.getCurrentConfig();
      const symbol = currentConfig.tradingSymbol;

      if (!symbol) {
        logger.warn('[TICK] Trading symbol is not set in configuration. Skipping tick.');
        return;
      }

      // --- LOGIKA JIKA SEDANG MEMILIKI POSISI ---
      if (this.currentPosition) {
        const currentPrice = await this.tradingService.getCurrentPrice(symbol);
        const { entryPrice } = this.currentPosition;
        const { stopLossPercentage, takeProfitPercentage } = currentConfig;

        // [LOGIKA BARU] Cek Stop Loss
        if (stopLossPercentage > 0) {
          const stopLossPrice = entryPrice * (1 - stopLossPercentage / 100);
          if (currentPrice <= stopLossPrice) {
            await this.closePosition(currentPrice, `Stop Loss triggered at ${stopLossPrice.toFixed(4)}`);
            return; // Hentikan tick ini karena posisi sudah ditutup
          }
        }

        // [LOGIKA BARU] Cek Take Profit
        if (takeProfitPercentage > 0) {
          const takeProfitPrice = entryPrice * (1 + takeProfitPercentage / 100);
          if (currentPrice >= takeProfitPrice) {
            await this.closePosition(currentPrice, `Take Profit triggered at ${takeProfitPrice.toFixed(4)}`);
            return; // Hentikan tick ini karena posisi sudah ditutup
          }
        }
        
        // Jika SL/TP tidak kena, lanjutkan cek sinyal strategi
        const pnl = (currentPrice - entryPrice) * this.currentPosition.quantity;
        const pnlPercentage = (pnl / (entryPrice * this.currentPosition.quantity)) * 100;
        logger.info(`[POSITION] Holding ${symbol}. Entry: ${entryPrice}, Current: ${currentPrice}, PnL: ${pnl.toFixed(4)} (${pnlPercentage.toFixed(2)}%)`);
        
        const signal = await this.tradingService.getTradingSignal(symbol);
        if (signal.action === 'SELL') {
          await this.closePosition(currentPrice, `Strategy Signal: ${signal.reason}`);
        }
      } 
      // --- LOGIKA JIKA TIDAK MEMILIKI POSISI ---
      else {
        const signal = await this.tradingService.getTradingSignal(symbol);
        if (signal.action === 'BUY') {
          const entryPrice = await this.tradingService.getCurrentPrice(symbol);
          const quantity = 1; // Kuantitas simulasi

          this.currentPosition = { symbol, entryPrice, quantity, timestamp: new Date() };

          await this.openPositionRepo.savePosition(this.currentPosition);
          
          await this.tradeLogRepo.createLog({
            symbol: symbol,
            action: 'BUY',
            reason: signal.reason,
            price: entryPrice,
            quantity: quantity,
          });

          const emoji = '🟢';
          const message = `${emoji} *BUY Executed* \n\n*Symbol:* ${symbol}\n*Price:* ${entryPrice.toFixed(4)}\n*Reason:* ${signal.reason}`;
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