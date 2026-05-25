import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, requireRole, verifyAccessToken } from "@/lib/auth";

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

    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to load admin orders." }, { status: 500 });
  }
}
