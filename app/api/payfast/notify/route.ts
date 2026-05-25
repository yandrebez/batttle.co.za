import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayFastITN } from "@/lib/payfast";

function extractSizeFromOrderItemName(name: string): string | null {
  const match = name.match(/\(([^)]+)\)\s*$/);
  if (!match) {
    return null;
  }

  const size = match[1]?.trim();
  return size ? size : null;
}

/**
 * PayFast Instant Transaction Notification (ITN) handler.
 * PayFast sends a POST with URL-encoded body after every payment event.
 */
export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    const parsed = new URLSearchParams(text);

    const signature = parsed.get("signature");
    if (!signature) {
      return new NextResponse("Missing signature", { status: 400 });
    }

    const passphrase = process.env.PAYFAST_PASSPHRASE ?? "";

    // Use ITN-specific verification: preserves received field order and
    // includes empty values, matching how PayFast computes the hash server-side.
    if (!verifyPayFastITN(text, passphrase, signature)) {
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const payment_status = parsed.get("payment_status") ?? "";
    const m_payment_id = parsed.get("m_payment_id") ?? "";
    const amount_gross = parsed.get("amount_gross") ?? "";

    // Only act on completed payments
    if (payment_status !== "COMPLETE") {
      return new NextResponse("OK", { status: 200 });
    }

    if (!m_payment_id) {
      return new NextResponse("Missing payment ID", { status: 400 });
    }

    const receivedAmount = Number(amount_gross);
    if (!Number.isFinite(receivedAmount)) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: m_payment_id },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          items: {
            select: {
              productId: true,
              quantity: true,
              name: true,
            },
          },
        },
      });

      if (!order) {
        return { kind: "not-found" as const };
      }

      // Verify the amount matches (prevent partial-payment fraud)
      const expected = order.totalAmount.toFixed(2);
      const received = receivedAmount.toFixed(2);
      if (received !== expected) {
        return { kind: "amount-mismatch" as const };
      }

      // ITN calls can be repeated; only process stock movement once.
      if (order.status !== "PENDING") {
        return { kind: "already-processed" as const };
      }

      for (const item of order.items) {
        const size = extractSizeFromOrderItemName(item.name);
        if (!size) {
          continue;
        }

        await tx.productSize.updateMany({
          where: {
            productId: item.productId,
            size,
            quantity: { gte: item.quantity },
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });
      }

      await tx.order.update({
        where: { id: m_payment_id },
        data: { status: "PROCESSING" },
      });

      return { kind: "processed" as const };
    });

    if (result.kind === "not-found") {
      return new NextResponse("Order not found", { status: 404 });
    }

    if (result.kind === "amount-mismatch") {
      return new NextResponse("Amount mismatch", { status: 400 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch {
    return new NextResponse("Internal error", { status: 500 });
  }
}
