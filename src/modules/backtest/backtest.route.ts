import { Router } from 'express';
import { BacktestController } from './backtest.controller';
import { backtestService } from '../../container';

const router = Router();
const backtestController = new BacktestController(backtestService);

// POST /api/backtest
router.post('/', backtestController.runBacktest);

export default router;