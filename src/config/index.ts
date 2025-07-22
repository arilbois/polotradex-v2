import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const config = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT || 3000,
  isTestnet: process.env.IS_TESTNET === 'true',
  apiSecretKey: process.env.API_SECRET_KEY || '',
  binance: {
    apiKey: process.env.BINANCE_API_KEY || '',
    apiSecret: process.env.BINANCE_API_SECRET || '',
  },
  binanceTestnet: {
    apiKey: process.env.BINANCE_API_KEY_TESTNET || '',
    apiSecret: process.env.BINANCE_API_SECRET_TESTNET || '',
  },
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },
};

if (config.nodeEnv === 'production' && !config.apiSecretKey) {
  console.error('FATAL ERROR: API_SECRET_KEY is not defined in .env file.');
  process.exit(1);
}

export default config;
