import { Router } from 'express';
import tradingRoutes from '@modules/trading/trading.route';
import configurationRoutes from '@modules/configuration/configuration.route';

const router = Router();

router.use('/trading', tradingRoutes);
router.use('/configuration', configurationRoutes);

export default router;
