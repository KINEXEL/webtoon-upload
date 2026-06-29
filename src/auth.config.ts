import type { NextAuthConfig } from "next-auth";

// Edge-safe 설정 — Prisma/bcrypt 미포함. proxy(미들웨어)에서 세션 판별용.
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  trustHost: true,
  logger: {
    error(error) {
      // 구 AUTH_SECRET 으로 암호화된 세션 쿠키 복호화 실패는 비로그인으로 정상 처리 → 로깅 생략
      if (error?.name === "JWTSessionError") return;
      console.error(error);
    },
  },
} satisfies NextAuthConfig;
