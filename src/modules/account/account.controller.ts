import { Request, Response } from 'express';
import { BalanceService } from '@core/services/balance.service';
import { TradeLogRepository } from '@infrastructure/repositories/trade-log.repository';
import { logger } from '@infrastructure/logger';
import { BalanceResponseDto } from './account.dto';
import { PnlService } from '@core/services/pnl.service'; 

export class AccountController {
  constructor(
    private balanceService: BalanceService,
    private tradeLogRepository: TradeLogRepository,
    private pnlService: PnlService 
  ) {}

  public getBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { asset } = req.query;
      if (!asset || typeof asset !== 'string') {
        res.status(400).json({ message: 'Query parameter "asset" is required.' });
        return;
      }
      const balance = await this.balanceService.getBalance(asset);

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

  public getPnl = async (req: Request, res: Response): Promise<void> => {
    try {
      const pnlReport = await this.pnlService.calculatePnl();
      res.status(200).json(pnlReport);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[AccountController] Error calculating PnL: ${errorMessage}`);
      res.status(500).json({ message: 'Failed to calculate PnL.' });
    }
  };
}