-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Configuration" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main_config',
    "tradingSymbol" TEXT NOT NULL DEFAULT 'BTC/USDT',
    "strategyName" TEXT NOT NULL DEFAULT 'RSI',
    "quoteOrderAmount" REAL NOT NULL DEFAULT 11,
    "rsiPeriod" INTEGER NOT NULL,
    "overboughtThreshold" INTEGER NOT NULL,
    "oversoldThreshold" INTEGER NOT NULL,
    "timeframe" TEXT NOT NULL,
    "macdFastPeriod" INTEGER NOT NULL DEFAULT 12,
    "macdSlowPeriod" INTEGER NOT NULL DEFAULT 26,
    "macdSignalPeriod" INTEGER NOT NULL DEFAULT 9,
    "stopLossPercentage" REAL NOT NULL DEFAULT 0,
    "takeProfitPercentage" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Configuration" ("createdAt", "id", "macdFastPeriod", "macdSignalPeriod", "macdSlowPeriod", "overboughtThreshold", "oversoldThreshold", "rsiPeriod", "stopLossPercentage", "strategyName", "takeProfitPercentage", "timeframe", "tradingSymbol", "updatedAt") SELECT "createdAt", "id", "macdFastPeriod", "macdSignalPeriod", "macdSlowPeriod", "overboughtThreshold", "oversoldThreshold", "rsiPeriod", "stopLossPercentage", "strategyName", "takeProfitPercentage", "timeframe", "tradingSymbol", "updatedAt" FROM "Configuration";
DROP TABLE "Configuration";
ALTER TABLE "new_Configuration" RENAME TO "Configuration";
CREATE TABLE "new_TradeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" REAL NOT NULL,
    "fee" REAL NOT NULL DEFAULT 0,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_TradeLog" ("action", "id", "price", "quantity", "reason", "symbol", "timestamp") SELECT "action", "id", "price", "quantity", "reason", "symbol", "timestamp" FROM "TradeLog";
DROP TABLE "TradeLog";
ALTER TABLE "new_TradeLog" RENAME TO "TradeLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
