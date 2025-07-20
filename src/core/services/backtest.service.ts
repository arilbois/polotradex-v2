import ccxt, { Exchange } from 'ccxt';
import { logger } from '@infrastructure/logger';
import { StrategyManager } from './strategy.manager';
import { ConfigurationRepository } from '@infrastructure/repositories/configuration.repository';
import { PnlService } from './pnl.service';
import { TradeLogRepository } from '@infrastructure/repositories/trade-log.repository';
import { BotConfig } from '@shared/interfaces/trading.interface';

interface OHLCVItem {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class MockTradeLogRepository extends TradeLogRepository {
  private logs: any[] = [];
  constructor() {
    super();
  }
  public setLogs(logs: any[]) {
    this.logs = logs;
  }
  public async getAllLogs(): Promise<any[]> {
    return Promise.resolve(this.logs);
  }
}

export class BacktestService {
  private exchange: Exchange;

  constructor(
    private strategyManager: StrategyManager,
    private configRepo: ConfigurationRepository
  ) {
    this.exchange = new ccxt.binance();
  }

  public async run(startDate: Date, endDate: Date) {
    const config = await this.configRepo.readConfig();
    logger.info('--- Memulai Backtest ---');
    logger.info(`Periode: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    logger.info(`Strategi: ${config.strategyName}, Simbol: ${config.tradingSymbol}`);

    const historicalData = await this.fetchHistoricalData(
      config.tradingSymbol,
      config.timeframe,
      startDate,
      endDate
    );

    if (historicalData.length < (config.macdSlowPeriod || config.rsiPeriod)) {
      throw new Error('Data historis tidak cukup untuk periode yang diberikan.');
    }

    let currentPosition: any = null;
    const tradeLogs: any[] = [];
    let wins = 0;
    let losses = 0;

    for (let i = 1; i < historicalData.length; i++) {
      const currentPrice = historicalData[i].close;
      const analysisSlice = historicalData.slice(0, i + 1);

      const mockExchange = {
        ...this.exchange,
        async fetchOHLCV() {
          return analysisSlice.map(c => [c.timestamp, c.open, c.high, c.low, c.close, c.volume]);
        },
      } as unknown as Exchange;

      if (currentPosition) {
        const { entryPrice } = currentPosition;
        const { stopLossPercentage, takeProfitPercentage } = config;

        if (
          stopLossPercentage > 0 &&
          currentPrice <= entryPrice * (1 - stopLossPercentage / 100)
        ) {
          if ((currentPrice - entryPrice) > 0) wins++; else losses++;
          tradeLogs.push({
            symbol: config.tradingSymbol,
            action: 'SELL',
            reason: 'Stop Loss',
            price: currentPrice,
            quantity: 1,
            timestamp: new Date(historicalData[i].timestamp)
          });
          currentPosition = null;
          continue;
        }

        if (
          takeProfitPercentage > 0 &&
          currentPrice >= entryPrice * (1 + takeProfitPercentage / 100)
        ) {
          if ((currentPrice - entryPrice) > 0) wins++; else losses++;
          tradeLogs.push({
            symbol: config.tradingSymbol,
            action: 'SELL',
            reason: 'Take Profit',
            price: currentPrice,
            quantity: 1,
            timestamp: new Date(historicalData[i].timestamp)
          });
          currentPosition = null;
          continue;
        }

        const signal = await this.strategyManager
          .getActiveStrategy()
          .generateSignal(mockExchange, config.tradingSymbol);

        if (signal.action === 'SELL') {
          if ((currentPrice - entryPrice) > 0) wins++; else losses++;
          tradeLogs.push({
            symbol: config.tradingSymbol,
            action: 'SELL',
            reason: signal.reason,
            price: currentPrice,
            quantity: 1,
            timestamp: new Date(historicalData[i].timestamp)
          });
          currentPosition = null;
        }
      } else {
        const signal = await this.strategyManager
          .getActiveStrategy()
          .generateSignal(mockExchange, config.tradingSymbol);

        if (signal.action === 'BUY') {
          currentPosition = {
            entryPrice: currentPrice,
            quantity: 1,
            timestamp: new Date(historicalData[i].timestamp)
          };
          tradeLogs.push({
            symbol: config.tradingSymbol,
            action: 'BUY',
            reason: signal.reason,
            price: currentPrice,
            quantity: 1,
            timestamp: new Date(historicalData[i].timestamp)
          });
        }
      }
    }

    const mockRepo = new MockTradeLogRepository();
    mockRepo.setLogs(tradeLogs);
    const pnlService = new PnlService(mockRepo);
    const pnlReport = await pnlService.calculatePnl();

    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(2) + '%' : 'N/A';

    logger.info('--- Backtest Selesai ---');
    return {
      summary: {
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        tradingSymbol: config.tradingSymbol,
        strategy: config.strategyName,
        totalRealizedPnl: pnlReport.totalRealizedPnl,
        totalTrades: pnlReport.totalTrades,
        winRate,
      },
      pnlReport,
      tradeLogs,
    };
  }

  private async fetchHistoricalData(
    symbol: string,
    timeframe: string,
    since: Date,
    to: Date
  ): Promise<OHLCVItem[]> {
    let allOhlcv: OHLCVItem[] = [];
    let sinceTimestamp = since.getTime();
    const limit = 1000;

    while (sinceTimestamp < to.getTime()) {
      logger.info(`Mengambil data historis sejak ${new Date(sinceTimestamp).toISOString()}`);
      const ohlcv = await this.exchange.fetchOHLCV(symbol, timeframe, sinceTimestamp, limit);
      if (ohlcv.length === 0) break;

      const mapped = ohlcv.map(
        c =>
          ({
            timestamp: c[0],
            open: c[1],
            high: c[2],
            low: c[3],
            close: c[4],
            volume: c[5],
          } as OHLCVItem)
      );

      allOhlcv = allOhlcv.concat(mapped);
      sinceTimestamp = ohlcv.at(-1)?.[0]! + 1;
    }

    return allOhlcv.filter(c => c.timestamp <= to.getTime());
  }
}
