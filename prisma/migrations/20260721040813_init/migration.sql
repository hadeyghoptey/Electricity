-- CreateTable
CREATE TABLE "Config" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "unitPrice" REAL NOT NULL DEFAULT 15,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "House" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "houseId" TEXT NOT NULL,
    "meterType" TEXT NOT NULL DEFAULT 'separate',
    "groupKey" TEXT DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Room_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtraMeter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExtraMeter_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "previous" REAL NOT NULL DEFAULT 0,
    "current" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reading_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtraMeterReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meterId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "previous" REAL NOT NULL DEFAULT 0,
    "current" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExtraMeterReading_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "ExtraMeter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "House_slug_key" ON "House"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Room_houseId_number_key" ON "Room"("houseId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "ExtraMeter_houseId_type_key" ON "ExtraMeter"("houseId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Reading_roomId_month_key" ON "Reading"("roomId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ExtraMeterReading_meterId_month_key" ON "ExtraMeterReading"("meterId", "month");
