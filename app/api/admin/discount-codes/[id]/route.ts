import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, requireRole, verifyAccessToken } from "@/lib/auth";

function ensureAdmin(request: NextRequest): NextResponse | null {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ message: "Missing token." }, { status: 401 });
  }

  try {
    const payload = verifyAccessToken(token);
    if (!requireRole(payload, "ADMIN")) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    return null;
  } catch {
    return NextResponse.json({ message: "Invalid token." }, { status: 401 });
  }
}

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const authError = ensureAdmin(request);
  if (authError) {
    return authError;
  }

  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      return NextResponse.json({ message: "Invalid discount code id." }, { status: 400 });
    }

    const body = (await request.json()) as {
      code?: string;
      percent?: number;
      isActive?: boolean;
    };

    const updates: {
      code?: string;
      percent?: number;
      isActive?: boolean;
    } = {};

    if (body.code !== undefined) {
      const code = String(body.code || "").trim().toUpperCase();
      if (!code) {
        return NextResponse.json({ message: "Discount code cannot be empty." }, { status: 400 });
      }
      updates.code = code;
    }

    if (body.percent !== undefined) {
      const percent = Number(body.percent);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        return NextResponse.json({ message: "Percent must be between 0 and 100." }, { status: 400 });
      }
      updates.percent = Math.round(percent);
    }

    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ message: "No changes provided." }, { status: 400 });
    }

    const updated = await prisma.discountCode.update({
      where: { id: numericId },
      data: updates,
    });

    return NextResponse.json({ code: updated }, { status: 200 });
  } catch (error) {
    const known = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : "";
    if (known === "P2002") {
      return NextResponse.json({ message: "This discount code already exists." }, { status: 409 });
    }
    if (known === "P2025") {
      return NextResponse.json({ message: "Discount code not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Failed to update discount code." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const authError = ensureAdmin(request);
  if (authError) {
    return authError;
  }

  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      return NextResponse.json({ message: "Invalid discount code id." }, { status: 400 });
    }

    await prisma.discountCode.delete({ where: { id: numericId } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const known = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : "";
    if (known === "P2025") {
      return NextResponse.json({ message: "Discount code not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Failed to delete discount code." }, { status: 500 });
  }
}
