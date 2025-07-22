import { Request, Response } from 'express';
import { tradingService } from '../../container';
import { logger } from '@infrastructure/logger';

export class TradingController {
  constructor() {}

  public getSignal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.query;
      if (!symbol || typeof symbol !== 'string') {
        res.status(400).json({ message: 'Query parameter "symbol" diperlukan.' });
        return;
      }
      logger.info(`[Controller] Received signal request for ${symbol}`);
      const signal = await tradingService.getTradingSignal(symbol);
      res.status(200).json(signal);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[Controller] Error getting signal: ${errorMessage}`);
      res.status(500).json({ message: 'Gagal mendapatkan sinyal trading.' });
    }
  };
}