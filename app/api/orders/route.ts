import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const guestEmail = searchParams.get("guestEmail");

    if (!userId && !guestEmail) {
      return NextResponse.json(
        { message: "Either userId or guestEmail is required" },
        { status: 400 },
      );
    }

    const orders = await prisma.order.findMany({
      where: userId && guestEmail
        ? {
            OR: [{ userId }, { guestEmail }],
          }
        : userId
          ? { userId }
          : { guestEmail },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Fetch orders error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ message }, { status: 500 });
  }
}
