import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, hashPassword, requireRole, verifyAccessToken } from "@/lib/auth";

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
    const email = body.email ? String(body.email).trim().toLowerCase() : undefined;
    const name = body.name !== undefined ? String(body.name || "").trim() : undefined;
    const password = body.password ? String(body.password) : undefined;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role !== "ADMIN") {
      return NextResponse.json({ message: "Admin user not found." }, { status: 404 });
    }

    if (email && email !== existing.email) {
      const duplicate = await prisma.user.findUnique({ where: { email } });
      if (duplicate) {
        return NextResponse.json({ message: "Email is already in use." }, { status: 409 });
      }
    }

    const data: { email?: string; name?: string | null; password?: string } = {};
    if (email) {
      data.email = email;
    }
    if (name !== undefined) {
      data.name = name || null;
    }
    if (password) {
      data.password = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ admin: updated }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to update admin user." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;

  if (auth.payload.userId === id) {
    return NextResponse.json({ message: "You cannot remove your own admin account." }, { status: 400 });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role !== "ADMIN") {
      return NextResponse.json({ message: "Admin user not found." }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "Admin user removed." }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to remove admin user." }, { status: 500 });
  }
}
