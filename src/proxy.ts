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

  // 주의: "로그인 상태면 /login → / 로 보낸다"는 처리를 여기(엣지)서 하면 안 된다.
  // 여기서는 JWT 복호화 여부만으로 isLoggedIn을 판단하는데, verified=false/isSuspended
  // 같은 DB 기준 조건은 이 단계에서 알 수 없다. 그 경우 페이지 쪽(DB 조회 가능)에서
  // /login으로 다시 돌려보내면 / ↔ /login 무한 리다이렉트 루프가 생긴다.
  // 로그인 상태에서 /login 접근 시 / 로 보내는 처리는 login 페이지(서버 컴포넌트)가
  // DB까지 확인한 뒤 담당한다.

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
