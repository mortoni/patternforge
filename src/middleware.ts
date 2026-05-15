import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Old preview path; query string is preserved on redirect. */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/preview/training-mobile") {
    const url = request.nextUrl.clone();
    url.pathname = "/preview/training";
    return NextResponse.redirect(url, 308);
  }
}

export const config = {
  matcher: "/preview/training-mobile",
};
