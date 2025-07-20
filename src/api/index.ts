import { Router } from 'express';
import tradingRoutes from '@modules/trading/trading.route';
import configurationRoutes from '@modules/configuration/configuration.route';
import botRoutes from '@modules/bot/bot.route';
import accountRoutes from '@modules/account/account.route';
import notificationRoutes from '@modules/notification/notification.route';
import backtestRoutes from '@modules/backtest/backtest.route'; 
import emergencyRoutes from '@modules/emergency/emergency.route'; 

const router = Router();

router.use('/trading', tradingRoutes);
router.use('/configuration', configurationRoutes);
router.use('/bot', botRoutes);
router.use('/account', accountRoutes);
router.use('/notification', notificationRoutes);
router.use('/backtest', backtestRoutes); 
router.use('/emergency', emergencyRoutes); 

export default router;
