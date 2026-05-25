import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    return NextResponse.json({ valid: false, discountPercent: 0 }, { status: 200 });
  }

  const codeRow = await prisma.discountCode.findFirst({
    where: {
      code: normalized,
      isActive: true,
    },
    select: {
      percent: true,
    },
  });

  const valid = Boolean(codeRow);

  return NextResponse.json(
    { valid, discountPercent: valid ? codeRow!.percent : 0 },
    { status: 200 },
  );
}
