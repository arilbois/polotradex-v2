import { Request, Response } from 'express';
import TradingService from './trading.service';
import { logger } from '@infrastructure/logger';

class TradingController {
  private tradingService: TradingService;

  constructor() {
    this.tradingService = new TradingService();
  }

  // Bind 'this' untuk memastikan konteks yang benar saat dipanggil oleh router
  public getSignal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.query;

      if (!symbol || typeof symbol !== 'string') {
        res.status(400).json({ message: 'Query parameter "symbol" is required.' });
        return;
      }

      logger.info(`[Controller] Received signal request for ${symbol}`);
      const signal = await this.tradingService.getTradingSignal(symbol);
      res.status(200).json(signal);

    } catch (error) {
      logger.error(`[Controller] Error getting signal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({ message: 'Failed to get trading signal.' });
    }
  };
}

export default TradingController;