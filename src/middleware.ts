import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PROTECTED_PATHS = ["/dashboard", "/api/dashboard", "/api/markets", "/api/regions", "/api/schools", "/api/activecampaign"];
const ADMIN_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check if path needs protection
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await verifyToken(token);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin-only check for mutations
  if (
    pathname.startsWith("/api/") &&
    ADMIN_METHODS.includes(request.method) &&
    session.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Pass role to downstream via header
  const response = NextResponse.next();
  response.headers.set("x-user-role", session.role);
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
