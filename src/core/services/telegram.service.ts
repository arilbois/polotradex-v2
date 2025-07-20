// src/core/services/telegram.service.ts
import { logger } from '@infrastructure/logger';
import config from '@config/index';

const TELEGRAM_API_URL = `https://api.telegram.org/bot${config.telegram.token}`;

export class TelegramService {
  /**
   * Mengirim pesan ke chat ID yang telah dikonfigurasi.
   * @param message - Teks pesan yang akan dikirim.
   */
  public async sendMessage(message: string): Promise<void> {
    // Jangan kirim pesan jika token atau chat ID tidak di-set
    if (!config.telegram.token || !config.telegram.chatId) {
      logger.warn('[Telegram] Token or Chat ID is not set. Skipping message.');
      return;
    }

    const url = `${TELEGRAM_API_URL}/sendMessage`;
    const body = {
      chat_id: config.telegram.chatId,
      text: message,
      parse_mode: 'Markdown', // Mengizinkan format seperti *bold* dan _italic_
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!result.ok) {
        logger.error(`[Telegram] Failed to send message: ${result.description}`);
      } else {
        logger.info(`[Telegram] Message sent successfully.`);
      }
    } catch (error) {
      logger.error('[Telegram] Error sending message:', error);
    }
  }
}