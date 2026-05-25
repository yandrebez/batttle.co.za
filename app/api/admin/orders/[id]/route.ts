import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, requireRole, verifyAccessToken } from "@/lib/auth";

const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const validDeliveryStatuses = ["UNASSIGNED", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

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
    const nextStatus =
      typeof body.status === "string" ? String(body.status || "").toUpperCase() : undefined;
    const nextDeliveryStatus =
      typeof body.deliveryStatus === "string"
        ? String(body.deliveryStatus || "").toUpperCase()
        : undefined;

    if (
      nextStatus !== undefined &&
      !validStatuses.includes(nextStatus as (typeof validStatuses)[number])
    ) {
      return NextResponse.json({ message: "Invalid order status." }, { status: 400 });
    }

    if (
      nextDeliveryStatus !== undefined &&
      !validDeliveryStatuses.includes(nextDeliveryStatus as (typeof validDeliveryStatuses)[number])
    ) {
      return NextResponse.json({ message: "Invalid delivery status." }, { status: 400 });
    }

    const updateData: {
      status?: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
      deliveryStatus?: "UNASSIGNED" | "ASSIGNED" | "OUT_FOR_DELIVERY" | "DELIVERED";
      courierCompany?: string | null;
      courierName?: string | null;
      courierPhone?: string | null;
      trackingCode?: string | null;
      deliveryNotes?: string | null;
      courierAssignedAt?: Date;
    } = {};

    if (nextStatus !== undefined) {
      updateData.status = nextStatus as "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    }

    if (nextDeliveryStatus !== undefined) {
      updateData.deliveryStatus = nextDeliveryStatus as "UNASSIGNED" | "ASSIGNED" | "OUT_FOR_DELIVERY" | "DELIVERED";
      if (nextDeliveryStatus !== "UNASSIGNED") {
        updateData.courierAssignedAt = new Date();
      }
    }

    if (body.courierCompany !== undefined) {
      const value = String(body.courierCompany || "").trim();
      updateData.courierCompany = value || null;
    }

    if (body.courierName !== undefined) {
      const value = String(body.courierName || "").trim();
      updateData.courierName = value || null;
    }

    if (body.courierPhone !== undefined) {
      const value = String(body.courierPhone || "").trim();
      updateData.courierPhone = value || null;
    }

    if (body.trackingCode !== undefined) {
      const value = String(body.trackingCode || "").trim();
      updateData.trackingCode = value || null;
    }

    if (body.deliveryNotes !== undefined) {
      const value = String(body.deliveryNotes || "").trim();
      updateData.deliveryNotes = value || null;
    }

    if (!Object.keys(updateData).length) {
      return NextResponse.json({ message: "No valid updates supplied." }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
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
