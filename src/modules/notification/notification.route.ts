import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { telegramService } from '../../container';

const router = Router();
const notificationController = new NotificationController(telegramService);

// POST /api/notification/test
router.post('/test', notificationController.sendTestNotification);

export default router;
