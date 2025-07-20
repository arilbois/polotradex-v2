export interface BacktestRequestDto {
  startDate: string; // Format ISO 8601, contoh: "2023-01-01T00:00:00Z"
  endDate: string;   // Format ISO 8601
}

export interface BacktestResultDto {
  summary: {
    period: string;
    tradingSymbol: string;
    strategy: string;
    totalRealizedPnl: number;
    totalTrades: number;
    winRate: string;
  };
  pnlReport: any; // Laporan dari PnlService
  tradeLogs: any[]; // Log transaksi yang dihasilkan selama backtest
}