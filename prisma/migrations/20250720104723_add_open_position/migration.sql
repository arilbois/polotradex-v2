-- CreateTable
CREATE TABLE "OpenPosition" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'active_position',
    "symbol" TEXT NOT NULL,
    "entryPrice" REAL NOT NULL,
    "quantity" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL
);
