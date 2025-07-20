// src/modules/bot/bot.route.ts
import { Router } from 'express';
import { BotController } from './bot.controller';
import { botService } from '../../container';

const router = Router();
const botController = new BotController(botService);

router.post('/start', botController.start);
router.post('/stop', botController.stop);
router.get('/status', botController.status);

export default router;