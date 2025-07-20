import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const config = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT || 3000,
  isTestnet: process.env.IS_TESTNET === 'true',
  binance: {
    apiKey: process.env.BINANCE_API_KEY || '',
    apiSecret: process.env.BINANCE_API_SECRET || '',
  },
  binanceTestnet: {
    apiKey: process.env.BINANCE_API_KEY_TESTNET || '',
    apiSecret: process.env.BINANCE_API_SECRET_TESTNET || '',
  },
};

export default config;