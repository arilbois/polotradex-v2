import ccxt, { Exchange, Order } from 'ccxt';
import { logger } from '@infrastructure/logger';
import config from '@config/index';

export class OrderService {
  public exchange: Exchange;

  constructor() {
    const exchangeOptions = {
      apiKey: config.isTestnet ? config.binanceTestnet.apiKey : config.binance.apiKey,
      secret: config.isTestnet ? config.binanceTestnet.apiSecret : config.binance.apiSecret,
    };
    this.exchange = new ccxt.binance(exchangeOptions);
    if (config.isTestnet) {
      this.exchange.setSandboxMode(true);
    }
  }

  /**
   * Menempatkan market order ke exchange.
   * @param symbol - Simbol trading, contoh: "BTC/USDT"
   * @param side - 'buy' atau 'sell'
   * @param amount - Jumlah yang akan dibeli (dalam base currency) atau dijual.
   * @param price - Harga saat ini untuk logging.
   * @returns Hasil order dari exchange.
   */
  public async placeMarketOrder(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    price: number
  ): Promise<Order> {
    try {
      logger.info(`Placing market ${side} order for ${amount} ${symbol} at ~${price}`);
      
      let order: Order;
      if (side === 'buy') {
        // Untuk buy, kita gunakan 'amount' sebagai jumlah quote currency (USDT)
        // CCXT akan menghitung berapa base currency (BTC) yang didapat.
        order = await this.exchange.createMarketBuyOrderWithCost(symbol, amount);
      } else {
        // Untuk sell, kita gunakan 'amount' sebagai jumlah base currency (BTC) yang akan dijual.
        order = await this.exchange.createMarketSellOrder(symbol, amount);
      }

      logger.info(`Order placed successfully: ID ${order.id}`);
      return order;
    } catch (error) {
      logger.error(`Failed to place market ${side} order for ${symbol}:`, error);
      // Lempar kembali error agar bisa ditangani oleh BotService
      throw error;
    }
  }
}
