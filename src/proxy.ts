import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getSecretText } from "@/lib/env";

const SESSION_COOKIE = "cashbook_session";
const PROTECTED = ["/dashboard", "/cashbooks", "/activity", "/profile"];

// Fast redirect for logged-out visitors. The real authorization check happens in requireUser() on every API route.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(`session:${await getSecretText()}`));
      return NextResponse.next();
    } catch {
      /* fall through to login */
    }
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/dashboard/:path*", "/cashbooks/:path*", "/activity/:path*", "/profile/:path*"] };
