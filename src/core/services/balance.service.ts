// src/core/services/balance.service.ts (Update)
import ccxt, { Exchange } from 'ccxt';
import { logger } from '@infrastructure/logger';
import config from '@config/index';

export class BalanceService {
  private exchange: Exchange;

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
   * Mengambil saldo untuk aset tertentu.
   * @param asset - Kode aset, contoh: "USDT", "BTC"
   */
  public async getBalance(asset: string): Promise<{ free: number; used: number; total: number }> {
    try {
      const balance = await this.exchange.fetchBalance();
      const assetBalance = balance[asset.toUpperCase()];

      // [DIPERBAIKI] Gunakan nullish coalescing operator (??) untuk memberikan nilai default 0
      // jika properti free, used, atau total bernilai undefined.
      return {
        free: assetBalance?.free ?? 0,
        used: assetBalance?.used ?? 0,
        total: assetBalance?.total ?? 0,
      };
    } catch (error) {
      logger.error(`Failed to fetch balance for ${asset}:`, error);
      throw new Error(`Could not fetch balance for ${asset}.`);
    }
  }
}