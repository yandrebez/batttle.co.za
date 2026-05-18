import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { buildPayFastPayload } from "@/lib/payfast";

type CartItemPayload = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
};

type InitiateRequest = {
  userId?: string;
  guestEmail?: string;
  deliveryMethod?: "HOME_DELIVERY" | "PUDO_PICKUP";
  pudoLocation?: string;
  pudoPointId?: string;
  fullName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  items: CartItemPayload[];
  discountCode?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InitiateRequest;
    const { userId, guestEmail, fullName, addressLine, city, postalCode, items, discountCode } = body;
    const deliveryMethod = body.deliveryMethod === "PUDO_PICKUP" ? "PUDO_PICKUP" : "HOME_DELIVERY";
    const pudoLocation = typeof body.pudoLocation === "string" ? body.pudoLocation.trim() : "";
    const pudoPointId = typeof body.pudoPointId === "string" ? body.pudoPointId.trim() : "";

    if (!fullName || !city || !postalCode || !items || items.length === 0) {
      return NextResponse.json({ message: "Missing required order fields." }, { status: 400 });
    }

    if (deliveryMethod === "HOME_DELIVERY" && !addressLine) {
      return NextResponse.json({ message: "Address is required for home delivery." }, { status: 400 });
    }

    if (deliveryMethod === "PUDO_PICKUP" && !pudoLocation) {
      return NextResponse.json({ message: "PUDO pickup point is required." }, { status: 400 });
    }

    if (!userId && !guestEmail) {
      return NextResponse.json({ message: "Either userId or guestEmail is required." }, { status: 400 });
    }

    let resolvedUserId: string | null = null;
    let resolvedUserEmail: string | null = null;
    let resolvedUserName: string | null = null;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        return NextResponse.json(
          { message: "Your session is out of date. Please sign in again." },
          { status: 401 },
        );
      }

      resolvedUserId = user.id;
      resolvedUserEmail = user.email;
      resolvedUserName = user.name;
    }

    const rawTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Validate discount code and compute final total
    let discountPercent = 0;
    const normalizedCode = typeof discountCode === "string" ? discountCode.trim().toUpperCase() : "";
    if (normalizedCode) {
      const codeRow = await prisma.discountCode.findFirst({
        where: {
          code: normalizedCode,
          isActive: true,
        },
        select: {
          percent: true,
        },
      });
      if (codeRow) {
        discountPercent = codeRow.percent;
      }
    }
    const discountMultiplier = Math.max(0, Math.min(100, discountPercent)) / 100;
    const totalAmount = parseFloat((rawTotal * (1 - discountMultiplier)).toFixed(2));

    const resolvedAddressLine =
      deliveryMethod === "PUDO_PICKUP" ? `PUDO Pickup Point: ${pudoLocation}` : addressLine;
    const deliveryNotes =
      deliveryMethod === "PUDO_PICKUP"
        ? `Delivery method: PUDO pickup. Pickup point: ${pudoLocation}`
        : "Delivery method: Home delivery.";

    // Create the order in PENDING state
    const order = await prisma.order.create({
      data: {
        userId: resolvedUserId,
        guestEmail: guestEmail ?? null,
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
            name: item.size ? `${item.name} (${item.size})` : item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      select: { id: true },
    });

    // Send confirmation email
    const recipientEmail = resolvedUserEmail ?? guestEmail;
    const recipientName = resolvedUserName ?? fullName;
    if (recipientEmail) {
      await sendOrderConfirmationEmail({
        recipientEmail,
        recipientName: recipientName ?? "Customer",
        order: {
          id: order.id,
          fullName,
          addressLine: resolvedAddressLine,
          city,
          postalCode,
          totalAmount,
          items: items.map((item) => ({
            name: item.size ? `${item.name} (${item.size})` : item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      });
    }

    // Build PayFast redirect data
    const merchantId = process.env.PAYFAST_MERCHANT_ID ?? "";
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY ?? "";
    const passphrase = process.env.PAYFAST_PASSPHRASE ?? "";
    const envAppUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/+$/, "");
    const appUrl = envAppUrl || request.nextUrl.origin.replace(/\/+$/, "");
    const rawNotifyUrl = (process.env.PAYFAST_NOTIFY_URL ?? "").trim();
    const notifyUrl = rawNotifyUrl
      ? rawNotifyUrl.startsWith("/")
        ? `${appUrl}${rawNotifyUrl}`
        : rawNotifyUrl
      : `${appUrl}/api/payfast/notify`;
    const isSandbox = process.env.PAYFAST_SANDBOX !== "false";

    const payfastParams: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${appUrl}/orders?payment=success`,
      cancel_url: `${appUrl}/cart?payment=cancelled`,
      notify_url: notifyUrl,
      name_first: fullName.split(" ")[0] ?? fullName,
      name_last: fullName.split(" ").slice(1).join(" ") || "",
      email_address: recipientEmail ?? "",
      m_payment_id: order.id,
      amount: totalAmount.toFixed(2),
      item_name: `Battle Store Order ${order.id}`,
      item_description: items.map((i) => i.name).join(", ").substring(0, 255),
    };

    // Remove blank optional fields before signing
    const cleanedParams = Object.fromEntries(
      Object.entries(payfastParams).filter(([, v]) => v !== ""),
    );

    const signedPayload = buildPayFastPayload(cleanedParams, passphrase);

    const payfastUrl = isSandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    return NextResponse.json(
      { orderId: order.id, payfastUrl, fields: signedPayload },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ message: "Failed to initiate payment." }, { status: 500 });
  }
}
