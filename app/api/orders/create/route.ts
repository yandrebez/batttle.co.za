import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import { getShippingPrice } from "@/lib/shipping";

type CreateOrderRequest = {
  userId?: string;
  guestEmail?: string;
  deliveryMethod?: "HOME_DELIVERY" | "PUDO_PICKUP";
  pudoLocation?: string;
  pudoPointId?: string;
  fullName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderRequest;

    const { userId, guestEmail, fullName, addressLine, city, postalCode, items } = body;
    const deliveryMethod = body.deliveryMethod === "PUDO_PICKUP" ? "PUDO_PICKUP" : "HOME_DELIVERY";
    const pudoLocation = typeof body.pudoLocation === "string" ? body.pudoLocation.trim() : "";
    const pudoPointId = typeof body.pudoPointId === "string" ? body.pudoPointId.trim() : "";
    let resolvedUserId: string | null = null;
    let resolvedUserEmail: string | null = null;
    let resolvedUserName: string | null = null;

    if (!fullName || !city || !postalCode || !items || items.length === 0) {
      return NextResponse.json(
        { message: "Missing required order fields" },
        { status: 400 },
      );
    }

    if (deliveryMethod === "HOME_DELIVERY" && !addressLine) {
      return NextResponse.json(
        { message: "Address is required for home delivery" },
        { status: 400 },
      );
    }

    if (deliveryMethod === "PUDO_PICKUP" && !pudoLocation) {
      return NextResponse.json(
        { message: "PUDO pickup point is required" },
        { status: 400 },
      );
    }

    if (!userId && !guestEmail) {
      return NextResponse.json(
        { message: "Either userId or guestEmail is required" },
        { status: 400 },
      );
    }

    if (userId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });

      if (!existingUser) {
        return NextResponse.json(
          { message: "Your session is out of date. Please sign in again." },
          { status: 401 },
        );
      }

      resolvedUserId = existingUser.id;
      resolvedUserEmail = existingUser.email;
      resolvedUserName = existingUser.name;
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingAmount = getShippingPrice(deliveryMethod);
    const totalAmount = parseFloat((subtotal + shippingAmount).toFixed(2));
    const resolvedAddressLine =
      deliveryMethod === "PUDO_PICKUP" ? `PUDO Pickup Point: ${pudoLocation}` : addressLine;
    const deliveryNotes =
      deliveryMethod === "PUDO_PICKUP"
        ? `Delivery method: PUDO pickup. Pickup point: ${pudoLocation}. Shipping: ${shippingAmount.toFixed(2)}.`
        : `Delivery method: Home delivery. Shipping: ${shippingAmount.toFixed(2)}.`;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        userId: resolvedUserId,
        guestEmail: guestEmail || null,
        fullName,
        addressLine: resolvedAddressLine,
        city,
        postalCode,
        totalAmount,
        courierCompany: deliveryMethod === "PUDO_PICKUP" ? "PUDO" : null,
        trackingCode: deliveryMethod === "PUDO_PICKUP" && pudoPointId ? pudoPointId : null,
        deliveryNotes,
        items: {
          create: items.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // Send confirmation email
    const recipientEmail = resolvedUserEmail || guestEmail;
    const recipientName = resolvedUserName || fullName;

    if (recipientEmail) {
      await sendOrderConfirmationEmail({
        recipientEmail,
        recipientName: recipientName || "Customer",
        order,
      });
    }

    return NextResponse.json(
      {
        message: "Order created successfully",
        order: {
          id: order.id,
          totalAmount: order.totalAmount,
          itemCount: order.items.length,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json({ message: "Order creation failed" }, { status: 500 });
  }
}
