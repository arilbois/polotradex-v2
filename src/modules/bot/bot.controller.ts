import { Request, Response } from 'express';
import { botService } from '../../container'; // Impor service-nya

export class BotController {
  // Constructor tidak lagi memerlukan dependensi
  constructor() {}

  // Setiap metode sekarang mengakses botService langsung dari container
  public start = async (req: Request, res: Response): Promise<void> => {
    try {
      // Pada saat API ini dipanggil, botService dijamin sudah ada
      await botService.start();
      res.status(200).json({ message: 'Bot started successfully.' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
  
  public status = (req: Request, res: Response): void => {
    try {
      const status = botService.getStatus();
      res.status(200).json(status);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: `Failed to get bot status: ${errorMessage}` });
    }
  };
}