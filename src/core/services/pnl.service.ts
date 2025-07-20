import { TradeLogRepository } from '@infrastructure/repositories/trade-log.repository';
import { logger } from '@infrastructure/logger';
import { PnlResponseDto, PnlDetailDto } from '@modules/account/account.dto';
import { TradeLog } from '@prisma/client';

export class PnlService {
  constructor(private tradeLogRepo: TradeLogRepository) {}

  /**
   * Menghitung PnL (Profit and Loss) dari semua riwayat transaksi.
   * Menggunakan metode FIFO (First-In, First-Out).
   */
  public async calculatePnl(): Promise<PnlResponseDto> {
    const allLogs = await this.tradeLogRepo.getAllLogs();

    if (allLogs.length === 0) {
      return {
        totalRealizedPnl: 0,
        totalTrades: 0,
        pnlBySymbol: {},
      };
    }

    // 1. Kelompokkan transaksi berdasarkan simbol
    const logsBySymbol = allLogs.reduce((acc, log) => {
      if (!acc[log.symbol]) {
        acc[log.symbol] = [];
      }
      acc[log.symbol].push(log);
      return acc;
    }, {} as Record<string, TradeLog[]>);

    const pnlBySymbol: Record<string, PnlDetailDto> = {};
    let totalRealizedPnl = 0;

    // 2. Hitung PnL untuk setiap simbol
    for (const symbol in logsBySymbol) {
      const symbolLogs = logsBySymbol[symbol];
      
      // Pisahkan dan urutkan buy/sell berdasarkan waktu (tertua dulu)
      const buys = symbolLogs.filter(l => l.action === 'BUY').sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const sells = symbolLogs.filter(l => l.action === 'SELL').sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      let realizedPnlForSymbol = 0;
      let buyIndex = 0;
      let sellIndex = 0;

      // 3. Terapkan logika FIFO
      while (buyIndex < buys.length && sellIndex < sells.length) {
        const buy = buys[buyIndex];
        const sell = sells[sellIndex];

        // Ambil kuantitas terkecil untuk dipasangkan
        const matchedQuantity = Math.min(buy.quantity, sell.quantity);

        if (matchedQuantity > 0) {
          // Hitung PnL untuk pasangan ini
          realizedPnlForSymbol += (sell.price - buy.price) * matchedQuantity;

          // Kurangi kuantitas yang sudah dipasangkan
          buy.quantity -= matchedQuantity;
          sell.quantity -= matchedQuantity;
        }

        // Pindah ke transaksi berikutnya jika kuantitas habis
        if (buy.quantity === 0) {
          buyIndex++;
        }
        if (sell.quantity === 0) {
          sellIndex++;
        }
      }
      
      pnlBySymbol[symbol] = {
        realizedPnl: realizedPnlForSymbol,
        totalBuyTrades: buys.length,
        totalSellTrades: sells.length,
      };
      
      totalRealizedPnl += realizedPnlForSymbol;
    }

    logger.info('PnL calculation completed.');
    return {
      totalRealizedPnl,
      totalTrades: allLogs.length,
      pnlBySymbol,
    };
  }
}