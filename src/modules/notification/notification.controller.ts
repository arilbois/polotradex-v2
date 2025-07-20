import { Request, Response } from 'express';
import { TelegramService } from '@core/services/telegram.service';
import { logger } from '@infrastructure/logger';

export class NotificationController {
  constructor(private telegramService: TelegramService) {}

  public sendTestNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ message: 'A "message" field is required in the body.' });
        return;
      }

      await this.telegramService.sendMessage(`🔔 *Test Notification*\n\n${message}`);
      res.status(200).json({ success: true, message: 'Test notification sent.' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[NotificationController] Error sending test notification: ${errorMessage}`);
      res.status(500).json({ message: 'Failed to send test notification.' });
    }
  };
}
