import { prisma } from "@/lib/prisma";
import { VALID_CURRENCY_CODES } from "@/lib/currency";

export type SiteSettings = {
  landingVideoUrl: string;
  logoUrl: string;
  siteBackgroundColor: string;
  discountCodes: string[];
  discountPercent: number;
  menuBackgroundColor: string;
  headerRowColor: string;
  currencyCode: string;
  maintenanceMode: boolean;
};

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  landingVideoUrl: "",
  logoUrl: "",
  siteBackgroundColor: "#eefaf2",
  discountCodes: [],
  discountPercent: 10,
  menuBackgroundColor: "#ffffff",
  headerRowColor: "#ffffff",
  currencyCode: "USD",
  maintenanceMode: false,
};

// Allow local/dev and production to keep separate settings even when using one shared DB.
const SETTINGS_ROW_ID = (() => {
  const override = process.env.SITE_SETTINGS_ROW_ID;
  if (override && /^\d+$/.test(override) && Number(override) > 0) {
    return Number(override);
  }

  return process.env.NODE_ENV === "production" ? 1 : 2;
})();

function normalizeColor(value: unknown): string {
  const color = typeof value === "string" ? value.trim() : "";
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color.toLowerCase();
  }

  return DEFAULT_SITE_SETTINGS.siteBackgroundColor;
}

async function ensureSiteSettingsTable() {
  await prisma.$executeRawUnsafe(`
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
    )
  `);

  await prisma.$executeRawUnsafe(`ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "maintenanceMode" BOOLEAN NOT NULL DEFAULT false`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "currencyCode" TEXT NOT NULL DEFAULT 'USD'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "menuBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "headerRowColor" TEXT NOT NULL DEFAULT '#ffffff'`);
}

function normalizeSettings(parsed: Partial<SiteSettings>): SiteSettings {
  return {
    landingVideoUrl:
      typeof parsed.landingVideoUrl === "string"
        ? parsed.landingVideoUrl.trim()
        : DEFAULT_SITE_SETTINGS.landingVideoUrl,
    logoUrl:
      typeof parsed.logoUrl === "string"
        ? parsed.logoUrl.trim()
        : DEFAULT_SITE_SETTINGS.logoUrl,
    siteBackgroundColor: normalizeColor(parsed.siteBackgroundColor),
    discountCodes: Array.isArray(parsed.discountCodes)
      ? parsed.discountCodes
          .map((entry) => (typeof entry === "string" ? entry.trim().toUpperCase() : ""))
          .filter((entry) => entry.length > 0)
      : DEFAULT_SITE_SETTINGS.discountCodes,
    discountPercent:
      typeof parsed.discountPercent === "number" &&
      parsed.discountPercent >= 0 &&
      parsed.discountPercent <= 100
        ? Math.round(parsed.discountPercent)
        : DEFAULT_SITE_SETTINGS.discountPercent,
    menuBackgroundColor: normalizeColor(parsed.menuBackgroundColor),
    headerRowColor: normalizeColor(parsed.headerRowColor),
    currencyCode:
      typeof parsed.currencyCode === "string" && VALID_CURRENCY_CODES.has(parsed.currencyCode)
        ? parsed.currencyCode
        : DEFAULT_SITE_SETTINGS.currencyCode,
    maintenanceMode: typeof parsed.maintenanceMode === "boolean" ? parsed.maintenanceMode : DEFAULT_SITE_SETTINGS.maintenanceMode,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: SETTINGS_ROW_ID } });
    if (!row) {
      const created = await prisma.siteSettings.create({
        data: { id: SETTINGS_ROW_ID, ...DEFAULT_SITE_SETTINGS },
      });
      return normalizeSettings(created);
    }

    return normalizeSettings(row);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : "";
    if (code === "P2021" || code === "P2022") {
      await ensureSiteSettingsTable();
      const row = await prisma.siteSettings.upsert({
        where: { id: SETTINGS_ROW_ID },
        update: {},
        create: { id: SETTINGS_ROW_ID, ...DEFAULT_SITE_SETTINGS },
      });
      return normalizeSettings(row);
    }

    return { ...DEFAULT_SITE_SETTINGS };
  }
}

export async function updateSiteSettings(partial: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSiteSettings();

  const next: SiteSettings = {
    landingVideoUrl:
      typeof partial.landingVideoUrl === "string"
        ? partial.landingVideoUrl.trim()
        : current.landingVideoUrl,
    logoUrl:
      typeof partial.logoUrl === "string"
        ? partial.logoUrl.trim()
        : current.logoUrl,
    siteBackgroundColor:
      partial.siteBackgroundColor !== undefined
        ? normalizeColor(partial.siteBackgroundColor)
        : current.siteBackgroundColor,
    discountCodes:
      partial.discountCodes !== undefined
        ? Array.isArray(partial.discountCodes)
          ? partial.discountCodes
              .map((entry) => (typeof entry === "string" ? entry.trim().toUpperCase() : ""))
              .filter((entry) => entry.length > 0)
          : current.discountCodes
        : current.discountCodes,
    discountPercent:
      typeof partial.discountPercent === "number" &&
      partial.discountPercent >= 0 &&
      partial.discountPercent <= 100
        ? Math.round(partial.discountPercent)
        : current.discountPercent,
    menuBackgroundColor:
      partial.menuBackgroundColor !== undefined
        ? normalizeColor(partial.menuBackgroundColor)
        : current.menuBackgroundColor,
    headerRowColor:
      partial.headerRowColor !== undefined
        ? normalizeColor(partial.headerRowColor)
        : current.headerRowColor,
    currencyCode:
      typeof partial.currencyCode === "string" && VALID_CURRENCY_CODES.has(partial.currencyCode)
        ? partial.currencyCode
        : current.currencyCode,
    maintenanceMode: typeof partial.maintenanceMode === "boolean" ? partial.maintenanceMode : current.maintenanceMode,
  };

  try {
    const row = await prisma.siteSettings.upsert({
      where: { id: SETTINGS_ROW_ID },
      update: next,
      create: { id: SETTINGS_ROW_ID, ...next },
    });
    return normalizeSettings(row);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : "";
    if (code === "P2021" || code === "P2022") {
      await ensureSiteSettingsTable();
      const row = await prisma.siteSettings.upsert({
        where: { id: SETTINGS_ROW_ID },
        update: next,
        create: { id: SETTINGS_ROW_ID, ...next },
      });
      return normalizeSettings(row);
    }

    return next;
  }
}