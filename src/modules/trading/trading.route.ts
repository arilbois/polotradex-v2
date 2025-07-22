import { Router } from 'express';
import { TradingController } from './trading.controller';

const router = Router();
const tradingController = new TradingController();

router.get('/signal', tradingController.getSignal);

export default router;