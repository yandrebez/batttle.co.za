import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

type CreateOrderRequest = {
  userId?: string;
  guestEmail?: string;
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
    let resolvedUserId: string | null = null;
    let resolvedUserEmail: string | null = null;
    let resolvedUserName: string | null = null;

    if (!fullName || !addressLine || !city || !postalCode || !items || items.length === 0) {
      return NextResponse.json(
        { message: "Missing required order fields" },
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

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order with items
    const order = await prisma.order.create({
      data: {
        userId: resolvedUserId,
        guestEmail: guestEmail || null,
        fullName,
        addressLine,
        city,
        postalCode,
        totalAmount,
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
