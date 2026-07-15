-- CreateTable
CREATE TABLE "Config" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "House" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "House_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "houseId" TEXT NOT NULL,
    "meterType" TEXT NOT NULL DEFAULT 'separate',
    "groupKey" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraMeter" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraMeter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reading" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "previous" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraMeterReading" (
    "id" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "previous" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraMeterReading_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraMeter" ADD CONSTRAINT "ExtraMeter_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reading" ADD CONSTRAINT "Reading_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraMeterReading" ADD CONSTRAINT "ExtraMeterReading_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "ExtraMeter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
