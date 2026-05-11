import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CACHEABLE_PATHS = [
  "/_next/static",
  "/_next/image",
  "/fonts",
  "/og-image.png",
  "/icon.svg",
  "/evpulse-polls.js",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isCacheable = CACHEABLE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path),
  );

  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (isCacheable) {
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
    return response;
  }

  const response = NextResponse.next();
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600",
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
