// middleware.ts
import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const userType = request.cookies.get("user-type")?.value;

  // 1. MANAGER SUPER-ACCESS:
  // If user is manager, allow access to EVERYTHING immediately.
  if (userType === "manager") {
    return NextResponse.next();
  }

  // Get the previous page URL for redirection
  const referer = request.headers.get("referer");

  const redirectBack = () => {
    if (referer) {
      return NextResponse.redirect(referer);
    }
    return NextResponse.redirect(new URL("/", request.url));
  };

  // 2. RESTRICT SPECIFIC ROUTES for other users:

  // Protect /cs routes: Only 'cs' (and 'manager') can enter.
  // Since we handled manager above, we just check if it's NOT 'cs'.
  if (pathname.startsWith("/cs") && userType !== "cs") {
    return redirectBack();
  }

  // Protect /manager AND /dashboard routes:
  // Since 'manager' is handled at the very top, anyone reaching this code block is NOT a manager.
  // Therefore, we block them from accessing /manager OR /dashboard.
  if (pathname.startsWith("/manager") || pathname.startsWith("/dashboard")) {
    return redirectBack();
  }

  // Default allow
  return NextResponse.next();
}

export const config = {
  // Don't forget to add "/dashboard/:path*" here!
  matcher: ["/cs/:path*", "/manager/:path*", "/dashboard/:path*"],
};
