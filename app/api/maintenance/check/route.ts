import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/siteSettings";

export async function GET(request: NextRequest) {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({
      maintenanceMode: settings.maintenanceMode,
    });
  } catch {
    return NextResponse.json(
      { maintenanceMode: false },
      { status: 500 }
    );
  }
}
