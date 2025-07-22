import { Router } from 'express';
import { ConfigurationController } from './configuration.controller';

const router = Router();
// Controller sekarang dibuat tanpa argumen
const configurationController = new ConfigurationController();

router.get('/', configurationController.getConfiguration);
router.put('/', configurationController.updateConfiguration);

export default router;