import { Router } from 'express';
import { EmergencyController } from './emergency.controller';
import { emergencyService } from '../../container';

const router = Router();
const emergencyController = new EmergencyController(emergencyService);

router.post('/buy', emergencyController.emergencyBuy);
router.post('/sell', emergencyController.emergencySell);
router.post('/sell-and-stop', emergencyController.sellAndStop);

export default router;