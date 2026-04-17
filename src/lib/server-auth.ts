import type { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAuthToken } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import type { AuthTokenPayload } from "@/types/auth";

export async function getServerAuth(): Promise<AuthTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyAuthToken(token);
}

export async function requireServerAuth(): Promise<AuthTokenPayload> {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login");
  }

  return auth;
}

export async function requireServerRole(role: Role): Promise<AuthTokenPayload> {
  const auth = await requireServerAuth();
  if (auth.role !== role) {
    redirect("/");
  }

  return auth;
}
