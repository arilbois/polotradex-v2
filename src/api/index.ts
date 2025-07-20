// src/api/index.ts
import { Router } from 'express';
import tradingRoutes from '@modules/trading/trading.route';
import configurationRoutes from '@modules/configuration/configuration.route';
import botRoutes from '@modules/bot/bot.route'; // Pastikan ini diimpor

const router = Router();

// Gabungkan semua rute dari setiap modul di sini
router.use('/trading', tradingRoutes);
router.use('/configuration', configurationRoutes);
router.use('/bot', botRoutes); // Pastikan baris ini ada

export default router;