import { logger } from '@infrastructure/logger';
import TradingService from '@modules/trading/trading.service';
import { TradeLogRepository } from '@infrastructure/repositories/trade-log.repository';
import { TelegramService } from './telegram.service';
import ConfigurationService from '@modules/configuration/configuration.service';
import { OpenPositionRepository, PositionData } from '@infrastructure/repositories/open-position.repository';
import { OrderService } from './order.service';
import { BalanceService } from './balance.service';
import { Order } from 'ccxt';

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
    private orderService: OrderService,
    private balanceService: BalanceService,
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
  private async closePosition(order: Order, reason: string) {
    if (!this.currentPosition) return;

    const { symbol, entryPrice } = this.currentPosition;
    // [DIPERBAIKI] Beri nilai default untuk properti dari order
    const exitPrice = order.average || order.price || 0;
    const quantity = order.filled || 0;
    const fee = order.fee?.cost || 0;

    const pnl = (exitPrice - entryPrice) * quantity;
    const pnlPercentage = (pnl / (entryPrice * quantity)) * 100;

    await this.tradeLogRepo.createLog({
      symbol,
      action: 'SELL',
      reason,
      price: exitPrice,
      quantity,
      fee,
    });

    const emoji = pnl >= 0 ? '💰' : '🔻';
    const message = `${emoji} *Position Closed* \n\n*Symbol:* ${symbol}\n*Price:* ${exitPrice.toFixed(4)}\n*Reason:* ${reason}\n*Realized PnL:* ${pnl.toFixed(4)} (${pnlPercentage.toFixed(2)}%)`;
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
      const [base, quote] = symbol.split('/');

      if (!symbol) {
        logger.warn('[TICK] Trading symbol is not set in configuration. Skipping tick.');
        return;
      }

      if (this.currentPosition) {
        const currentPrice = await this.tradingService.getCurrentPrice(symbol);
        const { entryPrice, quantity } = this.currentPosition;
        
        if (currentConfig.stopLossPercentage > 0 && currentPrice <= entryPrice * (1 - currentConfig.stopLossPercentage / 100)) {
          const order = await this.orderService.placeMarketOrder(symbol, 'sell', quantity, currentPrice);
          await this.closePosition(order, `Stop Loss triggered`);
          return;
        }
        
        if (currentConfig.takeProfitPercentage > 0 && currentPrice >= entryPrice * (1 + currentConfig.takeProfitPercentage / 100)) {
          const order = await this.orderService.placeMarketOrder(symbol, 'sell', quantity, currentPrice);
          await this.closePosition(order, `Take Profit triggered`);
          return;
        }

        const signal = await this.tradingService.getTradingSignal(symbol);
        if (signal.action === 'SELL') {
          const order = await this.orderService.placeMarketOrder(symbol, 'sell', quantity, currentPrice);
          await this.closePosition(order, `Strategy Signal: ${signal.reason}`);
        }

      } else {
        const signal = await this.tradingService.getTradingSignal(symbol);
        if (signal.action === 'BUY') {
          const currentPrice = await this.tradingService.getCurrentPrice(symbol);
          
          const quoteBalance = await this.balanceService.getBalance(quote);
          if (quoteBalance.free <= 1) {
            logger.warn(`[TICK] Saldo ${quote} tidak cukup untuk membeli. Saldo: ${quoteBalance.free}`);
            return;
          }
          const amountToSpend = (quoteBalance.free * currentConfig.orderPercentage) / 100;
          
          const order = await this.orderService.placeMarketOrder(symbol, 'buy', amountToSpend, currentPrice);

          // [DIPERBAIKI] Beri nilai default untuk properti dari order
          const entryPrice = order.average || order.price || 0;
          const quantity = order.filled || 0;
          const fee = order.fee?.cost || 0;

          if (quantity === 0) {
            logger.error('[TICK] Buy order was placed but resulted in 0 quantity. Aborting position open.');
            return;
          }

          this.currentPosition = {
            symbol: order.symbol,
            entryPrice,
            quantity,
            timestamp: new Date(order.timestamp),
          };

          await this.openPositionRepo.savePosition(this.currentPosition);
          
          await this.tradeLogRepo.createLog({
            symbol: order.symbol,
            action: 'BUY',
            reason: signal.reason,
            price: entryPrice,
            quantity,
            fee,
          });

          const emoji = '🟢';
          const message = `${emoji} *BUY Executed* \n\n*Symbol:* ${order.symbol}\n*Amount:* ${quantity.toFixed(6)} ${base}\n*Price:* ${entryPrice.toFixed(4)}\n*Cost:* ~$${order.cost?.toFixed(2)} ${quote}`;
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