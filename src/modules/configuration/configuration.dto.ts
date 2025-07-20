export interface UpdateConfigurationDto {
  rsiPeriod?: number;
  overboughtThreshold?: number;
  oversoldThreshold?: number;
  timeframe?: string;
}