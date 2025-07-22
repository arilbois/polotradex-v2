import { Request, Response } from 'express';
import { configurationService } from '../../container'; // Impor service-nya
import { logger } from '@infrastructure/logger';
import { UpdateConfigurationDto } from './configuration.dto';

export class ConfigurationController {
  constructor() {}

  public getConfiguration = async (req: Request, res: Response): Promise<void> => {
    try {
      const config = await configurationService.getCurrentConfig();
      res.status(200).json(config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      logger.error(`[ConfigController] Error getting configuration: ${errorMessage}`);
      res.status(500).json({ message: 'Failed to get configuration.' });
    }
  };

  public updateConfiguration = async (req: Request, res: Response): Promise<void> => {
    try {
      const configDto: UpdateConfigurationDto = req.body;
      const updatedConfig = await configurationService.updateConfig(configDto);
      logger.info(`[ConfigController] Configuration updated successfully.`);
      res.status(200).json({
        message: 'Configuration updated successfully',
        newConfig: updatedConfig,
      });
    } catch (error)      {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      logger.error(`[ConfigController] Error updating configuration: ${errorMessage}`);
      res.status(500).json({ message: 'Failed to update configuration.' });
    }
  };
}