import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, requireRole, verifyAccessToken } from "@/lib/auth";

const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

async function requireAdmin(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return { error: NextResponse.json({ message: "Missing token." }, { status: 401 }) };
  }

  try {
    const payload = verifyAccessToken(token);
    if (!requireRole(payload, "ADMIN")) {
      return { error: NextResponse.json({ message: "Forbidden." }, { status: 403 }) };
    }

    return { payload };
  } catch {
    return { error: NextResponse.json({ message: "Invalid token." }, { status: 401 }) };
  }
}

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const status = String(body.status || "").toUpperCase();

    if (!validStatuses.includes(status as (typeof validStatuses)[number])) {
      return NextResponse.json({ message: "Invalid order status." }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: status as "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" },
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
    });

    return NextResponse.json({ order }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to update order status." }, { status: 500 });
  }
}
