import { Router } from 'express';
import { AccountController } from './account.controller';
import { balanceService, tradeLogRepository, pnlService } from '../../container'; // Baru


const router = Router();
const accountController = new AccountController(balanceService, tradeLogRepository, pnlService);

// GET /api/account/balance?asset=USDT
router.get('/balance', accountController.getBalance);

// GET /api/account/trade-history
router.get('/trade-history', accountController.getTradeHistory);

// GET /api/account/pnl
router.get('/pnl', accountController.getPnl);

export default router;