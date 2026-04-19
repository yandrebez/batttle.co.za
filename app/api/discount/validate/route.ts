import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/siteSettings";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    return NextResponse.json({ valid: false, discountPercent: 0 }, { status: 200 });
  }

  const settings = await getSiteSettings();
  const valid = settings.discountCodes.includes(normalized);

  return NextResponse.json(
    { valid, discountPercent: valid ? settings.discountPercent : 0 },
    { status: 200 },
  );
}
