// File: src/modules/bot/bot.route.ts

import { Router } from 'express';
import { BotController } from './bot.controller';

const router = Router();
// Controller sekarang dibuat tanpa argumen
const botController = new BotController();

router.post('/start', botController.start);
router.post('/stop', botController.stop);
router.get('/status', botController.status);

export default router;