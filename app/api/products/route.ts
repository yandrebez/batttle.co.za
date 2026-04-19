import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isLegacySchemaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  const message = "message" in error && typeof error.message === "string" ? error.message : "";

  if (code === "P2021" || code === "P2022") {
    return true;
  }

  const lowered = message.toLowerCase();
  return lowered.includes("hassizes") || lowered.includes("productsize") || lowered.includes("images");
}

export async function GET() {
  try {
    let products;

    try {
      const productSelect: any = {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        images: true,
        hasSizes: true,
        sizes: {
          select: { id: true, size: true, quantity: true },
          orderBy: { size: "asc" },
        },
      };

      products = await prisma.product.findMany({
        where: { isActive: true },
        select: productSelect,
        orderBy: { id: "asc" },
      });

      products = products.map((product) => ({
        ...product,
        images: Array.isArray((product as unknown as { images?: unknown }).images)
          ? ((product as unknown as { images: string[] }).images)
          : [],
      }));
    } catch (error) {
      if (!isLegacySchemaError(error)) {
        throw error;
      }

      // Fallback for databases that do not yet have product size fields.
      const legacyProducts = await prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
        },
        orderBy: { id: "asc" },
      });

      products = legacyProducts.map((product) => ({
        ...product,
        images: [],
        hasSizes: false,
        sizes: [],
      }));
    }

    return NextResponse.json({ products }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to load products." }, { status: 500 });
  }
}
