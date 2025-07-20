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

  private runTick = async (): Promise<void> => {
    logger.info('--- Bot Tick Running ---');
    try {
      const currentConfig = await this.configService.getCurrentConfig();
      const symbol = currentConfig.tradingSymbol;

      if (!symbol) {
        logger.warn('[TICK] Trading symbol is not set in configuration. Skipping tick.');
        return;
      }

      if (this.currentPosition) {
        const currentPrice = await this.tradingService.getCurrentPrice(symbol);
        const pnl = (currentPrice - this.currentPosition.entryPrice) * this.currentPosition.quantity;
        const pnlPercentage = (pnl / (this.currentPosition.entryPrice * this.currentPosition.quantity)) * 100;
        logger.info(`[POSITION] Holding ${symbol}. Entry: ${this.currentPosition.entryPrice}, Current: ${currentPrice}, PnL: ${pnl.toFixed(4)} (${pnlPercentage.toFixed(2)}%)`);
        
        const signal = await this.tradingService.getTradingSignal(symbol);
        if (signal.action === 'SELL') {
          await this.tradeLogRepo.createLog({
            symbol: symbol,
            action: 'SELL',
            reason: signal.reason,
            price: currentPrice,
            quantity: this.currentPosition.quantity,
          });
          
          const emoji = '🔴';
          const message = `${emoji} *SELL Executed* \n\n*Symbol:* ${symbol}\n*Price:* ${currentPrice.toFixed(4)}\n*Reason:* ${signal.reason}\n*Realized PnL:* ${pnl.toFixed(4)} (${pnlPercentage.toFixed(2)}%)`;
          await this.telegramService.sendMessage(message);

          await this.openPositionRepo.deletePosition();
          this.currentPosition = null;
        }
      } else {
        const signal = await this.tradingService.getTradingSignal(symbol);
        if (signal.action === 'BUY') {
          const entryPrice = await this.tradingService.getCurrentPrice(symbol);
          const quantity = 1;

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