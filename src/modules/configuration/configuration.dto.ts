export interface UpdateConfigurationDto {
  tradingSymbol?: string;
  strategyName?: string;
  rsiPeriod?: number;
  overboughtThreshold?: number;
  oversoldThreshold?: number;
  timeframe?: string;
  stopLossPercentage?: number;
  takeProfitPercentage?: number;
}