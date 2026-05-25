-- CreateTable SiteSettings (baseline)
CREATE TABLE IF NOT EXISTS "SiteSettings" (
  "id" INTEGER PRIMARY KEY,
  "landingVideoUrl" TEXT NOT NULL DEFAULT '',
  "logoUrl" TEXT NOT NULL DEFAULT '',
  "siteBackgroundColor" TEXT NOT NULL DEFAULT '#eefaf2',
  "discountCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "discountPercent" INTEGER NOT NULL DEFAULT 10,
  "menuBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
  "headerRowColor" TEXT NOT NULL DEFAULT '#ffffff',
  "currencyCode" TEXT NOT NULL DEFAULT 'USD',
  "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add columns if table already exists
ALTER TABLE IF EXISTS "SiteSettings" ADD COLUMN IF NOT EXISTS "maintenanceMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS "SiteSettings" ADD COLUMN IF NOT EXISTS "currencyCode" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE IF EXISTS "SiteSettings" ADD COLUMN IF NOT EXISTS "menuBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff';
ALTER TABLE IF EXISTS "SiteSettings" ADD COLUMN IF NOT EXISTS "headerRowColor" TEXT NOT NULL DEFAULT '#ffffff';
