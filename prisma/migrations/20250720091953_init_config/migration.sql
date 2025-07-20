-- CreateTable
CREATE TABLE "Configuration" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main_config',
    "rsiPeriod" INTEGER NOT NULL,
    "overboughtThreshold" INTEGER NOT NULL,
    "oversoldThreshold" INTEGER NOT NULL,
    "timeframe" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
