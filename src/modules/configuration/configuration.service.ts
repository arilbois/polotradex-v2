import { BotConfig } from '@shared/interfaces/trading.interface';
import { UpdateConfigurationDto } from './configuration.dto';
import { ConfigurationRepository } from '@infrastructure/repositories/configuration.repository';
import { StrategyManager } from '@core/services/strategy.manager';
import { TelegramService } from '@core/services/telegram.service';
import { logger } from '@infrastructure/logger';

class ConfigurationService {
  constructor(
    private strategyManager: StrategyManager,
    private repository: ConfigurationRepository,
    private telegramService: TelegramService
  ) {}

  public async getCurrentConfig(): Promise<BotConfig> {
    return this.repository.readConfig();
  }

  public async updateConfig(newConfigDto: UpdateConfigurationDto): Promise<BotConfig> {
    const currentConfig = await this.repository.readConfig();
    const updatedConfig = { ...currentConfig, ...newConfigDto };

    this.strategyManager.updateActiveStrategy(updatedConfig);
    
    await this.repository.writeConfig(updatedConfig);
    
    await this.sendConfigChangeNotification(currentConfig, updatedConfig);
    
    return updatedConfig;
  }

  private async sendConfigChangeNotification(oldConfig: BotConfig, newConfig: BotConfig) {
    try {
      let changes = '';
      // [DIPERBAIKI] Gunakan 'keyof BotConfig' untuk iterasi yang aman secara tipe
      for (const key of Object.keys(newConfig) as Array<keyof BotConfig>) {
        if (oldConfig[key] !== newConfig[key]) {
          changes += `\n- *${this.formatKey(key)}:* ~${oldConfig[key]}~ -> *${newConfig[key]}*`;
        }
      }

      if (changes) {
        const message = `⚙️ *Configuration Updated*${changes}`;
        await this.telegramService.sendMessage(message);
      }
    } catch (error) {
        logger.error('Failed to send config change notification:', error);
    }
  }

  private formatKey(key: string): string {
    const result = key.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
}

export default ConfigurationService;