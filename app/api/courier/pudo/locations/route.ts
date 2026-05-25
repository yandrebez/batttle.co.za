import { NextRequest, NextResponse } from "next/server";
import { isCourierGuyConfigured, searchPudoLocations } from "@/lib/courierGuy";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const postalCode = (request.nextUrl.searchParams.get("postalCode") ?? "").trim();

  if (!query && !postalCode) {
    return NextResponse.json({ message: "Search text or postal code is required." }, { status: 400 });
  }

  if (!isCourierGuyConfigured()) {
    return NextResponse.json(
      { message: "Courier Guy integration is not configured yet." },
      { status: 503 },
    );
  }

  try {
    const locations = await searchPudoLocations({ query, postalCode });
    return NextResponse.json({ locations }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load PUDO locations.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
