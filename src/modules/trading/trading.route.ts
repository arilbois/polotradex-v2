// src/modules/trading/trading.route.ts
import { Router } from 'express';
import TradingController from './trading.controller';
import { tradingService } from '../../container';

const router = Router();
const tradingController = new TradingController(tradingService);

// Definisikan rute untuk mendapatkan sinyal trading
// GET /api/trading/signal?symbol=BTC/USDT
router.get('/signal', tradingController.getSignal);

export default router;
