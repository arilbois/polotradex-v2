import { logger } from '@infrastructure/logger';
import { BotService } from './bot.service';
import { OrderService } from './order.service';
import { ConfigurationRepository } from '@infrastructure/repositories/configuration.repository';
import { OpenPositionRepository } from '@infrastructure/repositories/open-position.repository';
import { BalanceService } from './balance.service';
import { Order } from 'ccxt';

export class EmergencyService {
  constructor(
    private botService: BotService,
    private orderService: OrderService,
    private configRepo: ConfigurationRepository,
    private openPositionRepo: OpenPositionRepository,
    private balanceService: BalanceService
  ) {}

  public async emergencyBuy(percentage: number): Promise<Order> {
    logger.warn(`--- EMERGENCY BUY TRIGGERED (${percentage}%) ---`);
    const config = await this.configRepo.readConfig();
    const [base, quote] = config.tradingSymbol.split('/');
    
    const quoteBalance = await this.balanceService.getBalance(quote);
    if (quoteBalance.free <= 0) {
      throw new Error(`Saldo ${quote} tidak cukup untuk membeli.`);
    }
    
    const amountToSpend = (quoteBalance.free * percentage) / 100;
    const currentPrice = await this.orderService.exchange.fetchTicker(config.tradingSymbol).then(t => t.last);

    // Lakukan pembelian
    const order = await this.orderService.placeMarketOrder(config.tradingSymbol, 'buy', amountToSpend, currentPrice || 0);

    // Simpan posisi baru
    const newPosition = {
      symbol: order.symbol,
      entryPrice: order.average || order.price,
      quantity: order.filled,
      timestamp: new Date(order.timestamp),
    };
    await this.openPositionRepo.savePosition(newPosition);

    this.botService.syncPositionState();
    
    return order;
  }

  public async emergencySell(percentage: number): Promise<Order | { message: string }> {
    logger.warn(`--- EMERGENCY SELL TRIGGERED (${percentage}%) ---`);
    const config = await this.configRepo.readConfig();
    const [base, quote] = config.tradingSymbol.split('/');

    const baseBalance = await this.balanceService.getBalance(base);
    if (baseBalance.free <= 0) {
      throw new Error(`Tidak ada ${base} untuk dijual.`);
    }

    const amountToSell = (baseBalance.free * percentage) / 100;
    const currentPrice = await this.orderService.exchange.fetchTicker(config.tradingSymbol).then(t => t.last);

    // Lakukan penjualan
    const order = await this.orderService.placeMarketOrder(config.tradingSymbol, 'sell', amountToSell, currentPrice || 0);

    // Hapus posisi jika menjual 100%
    if (percentage === 100) {
      await this.openPositionRepo.deletePosition();
      this.botService.clearCurrentPosition();
    }

    return order;
  }

  public async sellAndStop(): Promise<void> {
    logger.warn(`--- EMERGENCY SELL AND STOP TRIGGERED ---`);
    try {
      await this.emergencySell(100); // Jual 100%
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Gagal menjual posisi saat sell-and-stop, tapi bot akan tetap berhenti.', errorMessage);
    }
    await this.botService.stop();
  }
}
