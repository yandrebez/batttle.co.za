import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, requireRole, verifyAccessToken } from "@/lib/auth";

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

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const productSelect: any = {
    id: true,
    name: true,
    description: true,
    price: true,
    image: true,
    images: true,
    isActive: true,
    hasSizes: true,
    sizes: {
      select: { id: true, size: true, quantity: true },
      orderBy: { size: "asc" },
    },
    createdAt: true,
    updatedAt: true,
  };

  const products = await prisma.product.findMany({
    select: productSelect,
    orderBy: { id: "asc" },
  });

  const normalizedProducts = products.map((product: any) => ({
    ...product,
    images: Array.isArray((product as unknown as { images?: unknown }).images)
      ? ((product as unknown as { images: string[] }).images)
      : [],
  }));

  return NextResponse.json({ products: normalizedProducts }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const image = String(body.image || "").trim();
    const images = Array.isArray(body.images)
      ? body.images.map((value: unknown) => String(value || "").trim()).filter((value: string) => value.length > 0)
      : [];
    const price = Number(body.price);
    const isActive = body.isActive !== false;
    const hasSizes = body.hasSizes === true;
    const rawSizes: Array<{ size: string; quantity: number }> = Array.isArray(body.sizes) ? body.sizes : [];
    const sizes = hasSizes
      ? rawSizes
          .map((s) => ({ size: String(s.size || "").trim(), quantity: Number(s.quantity) || 0 }))
          .filter((s) => s.size.length > 0)
      : [];

    if (!name || !description || !image || !Number.isFinite(price)) {
      return NextResponse.json({ message: "Name, description, image, and valid price are required." }, { status: 400 });
    }

    const productData: any = {
      name,
      description,
      image,
      images,
      price,
      isActive,
      hasSizes,
      sizes: sizes.length > 0 ? { create: sizes } : undefined,
    };

    const productSelect: any = {
      id: true,
      name: true,
      description: true,
      price: true,
      image: true,
      images: true,
      isActive: true,
      hasSizes: true,
      sizes: { select: { id: true, size: true, quantity: true } },
      createdAt: true,
      updatedAt: true,
    };

    const product = await prisma.product.create({
      data: productData,
      select: productSelect,
    });

    const normalizedProduct = {
      ...product,
      images: Array.isArray((product as unknown as { images?: unknown }).images)
        ? ((product as unknown as { images: string[] }).images)
        : [],
    };

    return NextResponse.json({ product: normalizedProduct }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed to create product." }, { status: 500 });
  }
}
