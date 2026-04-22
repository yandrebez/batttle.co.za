import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, requireRole, verifyAccessToken } from "@/lib/auth";
import { getSiteSettings, updateSiteSettings } from "@/lib/siteSettings";
import { VALID_CURRENCY_CODES } from "@/lib/currency";

function ensureAdmin(request: NextRequest): NextResponse | null {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ message: "Missing token." }, { status: 401 });
  }

  try {
    const payload = verifyAccessToken(token);
    if (!requireRole(payload, "ADMIN")) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    return null;
  } catch {
    return NextResponse.json({ message: "Invalid token." }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  const authError = ensureAdmin(request);
  if (authError) {
    return authError;
  }

  const settings = await getSiteSettings();
  return NextResponse.json({ settings }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const authError = ensureAdmin(request);
  if (authError) {
    return authError;
  }

  try {
    const body = (await request.json()) as {
      landingVideoUrl?: string;
      logoUrl?: string;
      siteBackgroundColor?: string;
      menuBackgroundColor?: string;
      headerRowColor?: string;
      currencyCode?: string;
    };

    const landingVideoUrl =
      typeof body.landingVideoUrl === "string" ? body.landingVideoUrl.trim() : undefined;

    if (landingVideoUrl !== undefined && landingVideoUrl.length > 12_000_000) {
      return NextResponse.json({ message: "Video is too large." }, { status: 400 });
    }

    if (body.logoUrl !== undefined && (typeof body.logoUrl !== "string" || body.logoUrl.trim().length > 3_000_000)) {
      return NextResponse.json({ message: "Logo URL is invalid or too large." }, { status: 400 });
    }

    if (
      body.siteBackgroundColor !== undefined &&
      (typeof body.siteBackgroundColor !== "string" || !/^#[0-9a-fA-F]{6}$/.test(body.siteBackgroundColor.trim()))
    ) {
      return NextResponse.json({ message: "Background color must be a hex value like #112233." }, { status: 400 });
    }

    if (
      body.menuBackgroundColor !== undefined &&
      (typeof body.menuBackgroundColor !== "string" || !/^#[0-9a-fA-F]{6}$/.test(body.menuBackgroundColor.trim()))
    ) {
      return NextResponse.json({ message: "Menu color must be a hex value like #112233." }, { status: 400 });
    }

    if (
      body.headerRowColor !== undefined &&
      (typeof body.headerRowColor !== "string" || !/^#[0-9a-fA-F]{6}$/.test(body.headerRowColor.trim()))
    ) {
      return NextResponse.json({ message: "Header row color must be a hex value like #112233." }, { status: 400 });
    }

    if (body.currencyCode !== undefined && !VALID_CURRENCY_CODES.has(body.currencyCode)) {
      return NextResponse.json({ message: "Invalid currency code." }, { status: 400 });
    }

    const settings = await updateSiteSettings({
      landingVideoUrl,
      logoUrl: typeof body.logoUrl === "string" ? body.logoUrl.trim() : undefined,
      siteBackgroundColor: body.siteBackgroundColor,
      menuBackgroundColor: body.menuBackgroundColor,
      headerRowColor: body.headerRowColor,
      currencyCode: body.currencyCode,
    });

    return NextResponse.json({ settings }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to update site settings." }, { status: 500 });
  }
}
