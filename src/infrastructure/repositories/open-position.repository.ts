// src/infrastructure/repositories/open-position.repository.ts
import { PrismaClient, OpenPosition } from '@prisma/client';
import { logger } from '@infrastructure/logger';

// ID statis untuk satu-satunya entri posisi aktif di database.
const POSITION_ID = 'active_position';

export interface PositionData {
  symbol: string;
  entryPrice: number;
  quantity: number;
  timestamp: Date;
}

export class OpenPositionRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Membuat atau menyimpan data posisi aktif ke database.
   * @param positionData - Data posisi yang akan disimpan.
   */
  public async savePosition(positionData: PositionData): Promise<OpenPosition> {
    try {
      const position = await this.prisma.openPosition.upsert({
        where: { id: POSITION_ID },
        update: positionData,
        create: {
          id: POSITION_ID,
          ...positionData,
        },
      });
      logger.info(`Active position for ${positionData.symbol} saved to database.`);
      return position;
    } catch (error) {
      logger.error('Failed to save active position to database:', error);
      throw error;
    }
  }

  /**
   * Membaca posisi aktif dari database.
   * @returns Data posisi atau null jika tidak ada.
   */
  public async readPosition(): Promise<OpenPosition | null> {
    try {
      const position = await this.prisma.openPosition.findUnique({
        where: { id: POSITION_ID },
      });
      if (position) {
        logger.info(`Found active position for ${position.symbol} in database.`);
      }
      return position;
    } catch (error) {
      logger.error('Failed to read active position from database:', error);
      throw error;
    }
  }

  /**
   * Menghapus posisi aktif dari database (setelah ditutup/dijual).
   */
  public async deletePosition(): Promise<void> {
    try {
      // Gunakan deleteMany untuk menghindari error jika record tidak ada.
      await this.prisma.openPosition.deleteMany({
        where: { id: POSITION_ID },
      });
      logger.info('Active position deleted from database.');
    } catch (error) {
      logger.error('Failed to delete active position from database:', error);
      throw error;
    }
  }
}
