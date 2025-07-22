import { Router } from 'express';
import { BacktestController } from './backtest.controller';

const router = Router();
const backtestController = new BacktestController(); // Buat tanpa argumen

router.post('/', backtestController.runBacktest);

export default router;