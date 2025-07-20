-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Configuration" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main_config',
    "tradingSymbol" TEXT NOT NULL DEFAULT 'BTC/USDT',
    "strategyName" TEXT NOT NULL DEFAULT 'RSI',
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
INSERT INTO "new_Configuration" ("createdAt", "id", "overboughtThreshold", "oversoldThreshold", "rsiPeriod", "stopLossPercentage", "strategyName", "takeProfitPercentage", "timeframe", "tradingSymbol", "updatedAt") SELECT "createdAt", "id", "overboughtThreshold", "oversoldThreshold", "rsiPeriod", "stopLossPercentage", "strategyName", "takeProfitPercentage", "timeframe", "tradingSymbol", "updatedAt" FROM "Configuration";
DROP TABLE "Configuration";
ALTER TABLE "new_Configuration" RENAME TO "Configuration";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
