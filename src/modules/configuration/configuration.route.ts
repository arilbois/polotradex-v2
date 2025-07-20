import { Router } from 'express';
import ConfigurationController from './configuration.controller';
import { configurationService } from '../../container';

const router = Router();
const configurationController = new ConfigurationController(configurationService);

router.get('/', configurationController.getConfiguration);
router.put('/', configurationController.updateConfiguration);

export default router;