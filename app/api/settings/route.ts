import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/siteSettings";

export async function GET() {
  try {
    const settings = await getSiteSettings();

    return NextResponse.json(
      {
        settings: {
          landingVideoUrl: settings.landingVideoUrl,
          logoUrl: settings.logoUrl,
          siteBackgroundColor: settings.siteBackgroundColor,
          menuBackgroundColor: settings.menuBackgroundColor,
          headerRowColor: settings.headerRowColor,
          currencyCode: settings.currencyCode,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ message: "Failed to load site settings." }, { status: 500 });
  }
}
