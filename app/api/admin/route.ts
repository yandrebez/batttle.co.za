import { getTokenFromRequest, requireRole, verifyAccessToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ message: "Missing token." }, { status: 401 });
  }

  try {
    const payload = verifyAccessToken(token);

    if (!requireRole(payload, "ADMIN")) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json(
      { message: "Welcome Admin", user: payload },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ message: "Invalid token." }, { status: 401 });
  }
}
