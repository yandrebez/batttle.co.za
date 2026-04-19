import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
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
};

const SETTINGS_PATH = path.join(process.cwd(), "data", "site-settings.json");

function normalizeColor(value: unknown): string {
  const color = typeof value === "string" ? value.trim() : "";
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color.toLowerCase();
  }

  return DEFAULT_SITE_SETTINGS.siteBackgroundColor;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;

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
    };
  } catch {
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
  };

  await mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  await writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2), "utf8");

  return next;
}