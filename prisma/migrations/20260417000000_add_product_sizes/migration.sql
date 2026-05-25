-- Add hasSizes column to Product table
ALTER TABLE "Product" ADD COLUMN "hasSizes" BOOLEAN NOT NULL DEFAULT false;

-- Create ProductSize table
CREATE TABLE "ProductSize" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
