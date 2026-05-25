import { prisma } from "@/lib/prisma";
import { hashPassword, signAccessToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = body.name ? String(body.name).trim() : null;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists." },
        { status: 409 },
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    const token = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ token, user }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    const message = error instanceof Error ? error.message : "Registration failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
