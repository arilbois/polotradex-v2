export interface BalanceResponseDto {
  asset: string;
  free: number;
  used: number;
  total: number;
}

export interface PnlDetailDto {
  realizedPnl: number;
  totalBuyTrades: number;
  totalSellTrades: number;
}

export interface PnlResponseDto {
  totalRealizedPnl: number;
  totalTrades: number;
  pnlBySymbol: Record<string, PnlDetailDto>;
}