import { PrismaClient, TradeLog } from '@prisma/client';
import { logger } from '@infrastructure/logger';

export interface CreateTradeLogDto {
  symbol: string;
  action: 'BUY' | 'SELL';
  reason: string;
  price: number;
  quantity: number;
  fee?: number;
}

export class TradeLogRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Membuat catatan transaksi baru di database.
   * @param tradeData - Data transaksi yang akan disimpan.
   */
  public async createLog(tradeData: CreateTradeLogDto): Promise<TradeLog> {
    try {
      const log = await this.prisma.tradeLog.create({
        data: tradeData,
      });
      logger.info(`Trade log created for ${tradeData.action} ${tradeData.symbol}`);
      return log;
    } catch (error) {
      logger.error('Failed to create trade log in database:', error);
      throw error;
    }
  }

  /**
   * Mengambil semua catatan transaksi dari database.
   */
  public async getAllLogs(): Promise<TradeLog[]> {
    try {
      const logs = await this.prisma.tradeLog.findMany({
        orderBy: {
          timestamp: 'desc', // Tampilkan yang terbaru di atas
        },
      });
      return logs;
    } catch (error) {
      logger.error('Failed to retrieve trade logs from database:', error);
      throw error;
    }
  }
}
