import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, requireRole, verifyAccessToken } from "@/lib/auth";

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

  const codes = await prisma.discountCode.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ codes }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const authError = ensureAdmin(request);
  if (authError) {
    return authError;
  }

  try {
    const body = (await request.json()) as {
      code?: string;
      percent?: number;
      isActive?: boolean;
    };

    const code = String(body.code || "").trim().toUpperCase();
    const percent = Number(body.percent);
    const isActive = body.isActive !== false;

    if (!code) {
      return NextResponse.json({ message: "Discount code is required." }, { status: 400 });
    }

    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      return NextResponse.json({ message: "Percent must be between 0 and 100." }, { status: 400 });
    }

    const created = await prisma.discountCode.create({
      data: { code, percent: Math.round(percent), isActive },
    });

    return NextResponse.json({ code: created }, { status: 201 });
  } catch (error) {
    const known = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : "";
    if (known === "P2002") {
      return NextResponse.json({ message: "This discount code already exists." }, { status: 409 });
    }

    return NextResponse.json({ message: "Failed to create discount code." }, { status: 500 });
  }
}
