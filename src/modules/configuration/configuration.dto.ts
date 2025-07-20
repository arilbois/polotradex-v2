export interface UpdateConfigurationDto {
  tradingSymbol?: string;
  strategyName?: string;
  // RSI
  rsiPeriod?: number;
  overboughtThreshold?: number;
  oversoldThreshold?: number;
  timeframe?: string;
  // MACD
  macdFastPeriod?: number;
  macdSlowPeriod?: number;
  macdSignalPeriod?: number;
  // Risk Management
  stopLossPercentage?: number;
  takeProfitPercentage?: number;
}