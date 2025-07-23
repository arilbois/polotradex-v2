export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export interface StrategySignal {
  action: SignalType;
  confidence: number;
  reason: string;
  timestamp: Date;
  metadata?: any;
  OrderAmount: number;
}

export interface BotConfig {
  tradingSymbol: string;
  strategyName: string;
  // RSI
  rsiPeriod: number;
  overboughtThreshold: number;
  oversoldThreshold: number;
  timeframe: string;
  // MACD
  macdFastPeriod: number;
  macdSlowPeriod: number;
  macdSignalPeriod: number;
  // Risk Management
  stopLossPercentage: number;
  takeProfitPercentage: number;
  orderPercentage: number;

  isMonitoringEnabled: boolean;

  srLookbackPeriod: number;
  srPivotStrength: number;
  }