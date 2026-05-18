import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAINTENANCE_ALLOWED_PATHS = ["/admin", "/api/auth", "/api/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if maintenance mode is enabled
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
    });

    if (settings?.maintenanceMode) {
      // Allow admin and auth-related routes
      const isAllowedPath =
        pathname === "/admin" ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/settings") ||
        pathname === "/_next" ||
        pathname.startsWith("/_vercel") ||
        pathname.includes(".") ||
        pathname === "/favicon.ico";

      if (!isAllowedPath) {
        // Redirect to maintenance page
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  } catch (error) {
    // If database error, continue normally
    console.error("Middleware database error:", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
