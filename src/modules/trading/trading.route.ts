// src/modules/trading/trading.route.ts
import { Router } from 'express';
import TradingController from './trading.controller';

const router = Router();
const tradingController = new TradingController();

// Definisikan rute untuk mendapatkan sinyal trading
// GET /api/trading/signal?symbol=BTC/USDT
router.get('/signal', tradingController.getSignal);

export default router;
