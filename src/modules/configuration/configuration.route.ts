// src/modules/configuration/configuration.route.ts
import { Router } from 'express';
import ConfigurationController from './configuration.controller';
import { configurationService } from '../../container';

const router = Router();
const configurationController = new ConfigurationController(configurationService);

// GET /api/configuration -> Untuk melihat konfigurasi saat ini
router.get('/', configurationController.getConfiguration);

// PUT /api/configuration -> Untuk memperbarui konfigurasi
router.put('/', configurationController.updateConfiguration);

export default router;