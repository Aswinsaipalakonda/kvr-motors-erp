import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("jwt_token")?.value;
  const role = request.cookies.get("user_role")?.value;
  const { pathname } = request.nextUrl;

  const isOwnerRoute = pathname.startsWith("/owner");
  const isSupervisorRoute = pathname.startsWith("/supervisor");
  const isSalesRoute = pathname.startsWith("/sales");
  const isTelecallerRoute = pathname.startsWith("/telecaller");
  const isStaffRoute = pathname.startsWith("/staff");

  // 1. If visiting a protected dashboard path, verify authentication
  if (isOwnerRoute || isSupervisorRoute || isSalesRoute || isTelecallerRoute || isStaffRoute) {
    if (!token || !role) {
      // Direct unauthorized anonymous session to login screen
      const loginUrl = new URL("/login", request.url);
      // Pass the original destination path as query context for UX post-auth redirect
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based directory matching
    if (isOwnerRoute && role !== "owner" && role !== "admin") {
      return redirectToRoleDashboard(role, request);
    }

    if (isSupervisorRoute && role !== "supervisor" && role !== "owner" && role !== "admin") {
      return redirectToRoleDashboard(role, request);
    }

    if (isSalesRoute && role !== "sales_executive" && role !== "sales" && role !== "owner" && role !== "admin") {
      return redirectToRoleDashboard(role, request);
    }

    if (isTelecallerRoute && role !== "telecaller" && role !== "owner" && role !== "admin") {
      return redirectToRoleDashboard(role, request);
    }

    if (isStaffRoute && role !== "staff" && role !== "owner" && role !== "admin") {
      return redirectToRoleDashboard(role, request);
    }
  }

  // 2. If visiting /login while already active, bounce back to dashboard
  if (pathname === "/login" && token && role) {
    return redirectToRoleDashboard(role, request);
  }

  return NextResponse.next();
}

function redirectToRoleDashboard(role: string, request: NextRequest) {
  const roleRedirectMap: Record<string, string> = {
    admin: "/owner",
    owner: "/owner",
    supervisor: "/supervisor",
    sales_executive: "/sales",
    sales: "/sales",
    telecaller: "/telecaller",
    staff: "/staff",
  };

  const targetPath = roleRedirectMap[role] || "/";
  const redirectUrl = new URL(targetPath, request.url);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/owner/:path*",
    "/supervisor/:path*",
    "/sales/:path*",
    "/telecaller/:path*",
    "/staff/:path*",
    "/login",
  ],
};
