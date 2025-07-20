import { Request, Response } from 'express';
import { BotService } from '@core/services/bot.service';
import { logger } from '@infrastructure/logger';

export class BotController {
  private botService: BotService;

  constructor(botService: BotService) {
    this.botService = botService;
  }

  public start = (req: Request, res: Response): void => {
    try {
      this.botService.start();
      res.status(200).json({ message: 'Bot started successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to start bot.' });
    }
  };

  public stop = (req: Request, res: Response): void => {
    try {
      this.botService.stop();
      res.status(200).json({ message: 'Bot stopped successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to stop bot.' });
    }
  };
  
  public status = (req: Request, res: Response): void => {
    try {
      const status = this.botService.getStatus();
      res.status(200).json(status);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get bot status.' });
    }
  };
}
