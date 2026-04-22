-- Create enum for delivery workflow
CREATE TYPE "DeliveryStatus" AS ENUM ('UNASSIGNED', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED');

-- Extend Order with courier tracking metadata
ALTER TABLE "Order"
  ADD COLUMN "courierCompany" TEXT,
  ADD COLUMN "courierName" TEXT,
  ADD COLUMN "courierPhone" TEXT,
  ADD COLUMN "trackingCode" TEXT,
  ADD COLUMN "deliveryNotes" TEXT,
  ADD COLUMN "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'UNASSIGNED',
  ADD COLUMN "courierAssignedAt" TIMESTAMP(3);

-- Create normalized discount codes table
CREATE TABLE "DiscountCode" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "percent" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiscountCode_code_key" ON "DiscountCode"("code");
