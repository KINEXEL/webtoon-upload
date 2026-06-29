import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

// Edge-safe NextAuth (proxy 컨벤션 — Next 16) — authConfig 는 Prisma/bcrypt 미포함
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { nextUrl } = request;
  const isLoggedIn = Boolean(request.auth?.user);
  const isLoginPage = nextUrl.pathname === "/login";

  // 미로그인 → 로그인 페이지로
  if (!isLoggedIn && !isLoginPage) {
    const url = nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 로그인 상태로 /login 접근 → 대시보드로
  if (isLoggedIn && isLoginPage) {
    const url = nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
