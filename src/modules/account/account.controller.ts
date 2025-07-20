import { Request, Response } from 'express';
import { BalanceService } from '@core/services/balance.service';
import { TradeLogRepository } from '@infrastructure/repositories/trade-log.repository';
import { logger } from '@infrastructure/logger';
import { BalanceResponseDto } from './account.dto'; // Baru

export class AccountController {
  constructor(
    private balanceService: BalanceService,
    private tradeLogRepository: TradeLogRepository
  ) {}

  public getBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { asset } = req.query;
      if (!asset || typeof asset !== 'string') {
        res.status(400).json({ message: 'Query parameter "asset" is required.' });
        return;
      }
      const balance = await this.balanceService.getBalance(asset);

      // [DIPERBAIKI] Gunakan DTO untuk membentuk response
      const response: BalanceResponseDto = {
        asset: asset.toUpperCase(),
        ...balance,
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[AccountController] Error getting balance: ${errorMessage}`);
      res.status(500).json({ message: 'Failed to get balance.' });
    }
  };

  public getTradeHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const logs = await this.tradeLogRepository.getAllLogs();
      res.status(200).json(logs);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[AccountController] Error getting trade history: ${errorMessage}`);
      res.status(500).json({ message: 'Failed to get trade history.' });
    }
  };
}