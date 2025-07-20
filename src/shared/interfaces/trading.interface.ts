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
}

export interface RSIStrategyParams {
  rsiPeriod: number;
  overboughtThreshold: number;
  oversoldThreshold: number;
  timeframe: string;
}