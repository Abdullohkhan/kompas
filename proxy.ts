import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic gate only: it checks that the auth cookie exists. The backend verifies the JWT on
// every API call and the client redirects to /login on a 401, so a forged cookie gets no data.
const AUTH_COOKIE = "kompas_token";

export function proxy(request: NextRequest) {
  const hasToken = Boolean(request.cookies.get(AUTH_COOKIE)?.value);
  const isLogin = request.nextUrl.pathname === "/login";

  if (!hasToken && !isLogin) return NextResponse.redirect(new URL("/login", request.url));
  if (hasToken && isLogin) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
