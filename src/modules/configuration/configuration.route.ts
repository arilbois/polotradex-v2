// src/modules/configuration/configuration.route.ts
import { Router } from 'express';
import ConfigurationController from './configuration.controller';

const router = Router();
const configurationController = new ConfigurationController();

// GET /api/configuration -> Untuk melihat konfigurasi saat ini
router.get('/', configurationController.getConfiguration);

// PUT /api/configuration -> Untuk memperbarui konfigurasi
router.put('/', configurationController.updateConfiguration);

export default router;