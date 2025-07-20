import { Router } from 'express';
import { AccountController } from './account.controller';
import { balanceService, tradeLogRepository } from '../../container';

const router = Router();
const accountController = new AccountController(balanceService, tradeLogRepository);

// GET /api/account/balance?asset=USDT
router.get('/balance', accountController.getBalance);

// GET /api/account/trade-history
router.get('/trade-history', accountController.getTradeHistory);

export default router;