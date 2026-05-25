import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

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
          maintenanceMode: settings.maintenanceMode,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ message: "Failed to load site settings." }, { status: 500 });
  }
}
