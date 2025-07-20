import { Router } from 'express';
import tradingRoutes from '@modules/trading/trading.route';

const router = Router();

// Gabungkan semua rute dari setiap modul di sini
router.use('/trading', tradingRoutes);
// router.use('/configuration', configurationRoutes); // Contoh untuk masa depan

export default router;