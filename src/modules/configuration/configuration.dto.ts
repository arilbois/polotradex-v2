export interface UpdateConfigurationDto {
  tradingSymbol?: string;
  rsiPeriod?: number;
  overboughtThreshold?: number;
  oversoldThreshold?: number;
  timeframe?: string;
}