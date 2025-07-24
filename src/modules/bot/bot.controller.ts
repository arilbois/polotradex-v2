import { Request, Response } from 'express';
import { botService, configurationService, tradingService } from '../../container';
import { logger } from '@infrastructure/logger';

export class BotController {
  constructor() {}

  public start = async (req: Request, res: Response): Promise<void> => {
    try {
      const config = await configurationService.getCurrentConfig();
      const symbol = config.tradingSymbol;
      const [base, quote] = symbol.split('/');

      await botService.start();
      
      // Get current price and initial signal
      const currentPrice = await tradingService.getCurrentPrice(symbol);
      const initialSignal = await tradingService.getTradingSignal(symbol);

      const response = {
        message: 'Bot started successfully.',
        data: {
          symbol: symbol,
          strategy: config.strategyName,
          status: 'Waiting for BUY signal',
          currentPrice: currentPrice,
          initialReason: initialSignal.reason,
          timestamp: new Date().toISOString()
        }
      };

      logger.info(`[BotController] Bot started with response:`, response);
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[BotController] Failed to start bot:`, error);
      res.status(500).json({ message: `Failed to start bot: ${errorMessage}` });
    }
  };

  public stop = async (req: Request, res: Response): Promise<void> => {
    try {
      await botService.stop();
      res.status(200).json({ message: 'Bot stopped successfully.' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: `Failed to stop bot: ${errorMessage}` });
    }
  };
  
  public status = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = botService.getStatus();
      const config = await configurationService.getCurrentConfig();
      
      // Get current price if bot is running
      let currentPrice = null;
      let currentSignal = null;
      
      if (status.isRunning) {
        try {
          currentPrice = await tradingService.getCurrentPrice(config.tradingSymbol);
          currentSignal = await tradingService.getTradingSignal(config.tradingSymbol);
        } catch (error) {
          logger.warn(`[BotController] Could not fetch current price/signal:`, error);
        }
      }

      const response = {
        ...status,
        config: {
          symbol: config.tradingSymbol,
          strategy: config.strategyName,
          timeframe: config.timeframe
        },
        currentPrice: currentPrice,
        currentSignal: currentSignal ? {
          action: currentSignal.action,
          reason: currentSignal.reason,
          confidence: currentSignal.confidence
        } : null,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[BotController] Failed to get bot status:`, error);
      res.status(500).json({ message: `Failed to get bot status: ${errorMessage}` });
    }
  };
}