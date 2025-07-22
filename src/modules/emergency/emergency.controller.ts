import { Request, Response } from 'express';
import { emergencyService } from '../../container';
import { logger } from '@infrastructure/logger';
import { EmergencyActionDto } from './emergency.dto';

export class EmergencyController {
  constructor() {}

  public emergencyBuy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { percentage } = req.body as EmergencyActionDto;
      if (!percentage || percentage <= 0 || percentage > 100) {
        res.status(400).json({ message: 'percentage (1-100) diperlukan.' });
        return;
      }
      const result = await emergencyService.emergencyBuy(percentage);
      res.status(200).json({ message: 'Emergency BUY berhasil dieksekusi.', order: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ message: errorMessage });
    }
  };

  public emergencySell = async (req: Request, res: Response): Promise<void> => {
    try {
      const { percentage } = req.body as EmergencyActionDto;
      if (!percentage || percentage <= 0 || percentage > 100) {
        res.status(400).json({ message: 'percentage (1-100) diperlukan.' });
        return;
      }
      const result = await emergencyService.emergencySell(percentage);
      res.status(200).json({ message: 'Emergency SELL berhasil dieksekusi.', order: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ message: errorMessage });
    }
  };

  public sellAndStop = async (req: Request, res: Response): Promise<void> => {
    try {
      await emergencyService.sellAndStop();
      res.status(200).json({ message: 'Semua posisi berhasil dijual dan bot telah dihentikan.' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ message: errorMessage });
    }
  };
}