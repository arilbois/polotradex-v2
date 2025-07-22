import { Request, Response } from 'express';
import { backtestService } from '../../container';
import { logger } from '@infrastructure/logger';
import { BacktestRequestDto } from './backtest.dto';

export class BacktestController {
  constructor() {} // Hapus dependensi

  public runBacktest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.body as BacktestRequestDto;
      if (!startDate || !endDate) {
        res.status(400).json({ message: 'startDate dan endDate diperlukan.' });
        return;
      }
      // Panggil service langsung dari container
      const result = await backtestService.run(new Date(startDate), new Date(endDate));
      res.status(200).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[BacktestController] Error running backtest: ${errorMessage}`);
      res.status(500).json({ message: 'Gagal menjalankan backtest.' });
    }
  };
}