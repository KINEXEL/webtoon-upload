import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { authConfig } from "@/auth.config";
import { isGoogleAuthConfigured } from "@/lib/auth/google";
import { oauthAdapter } from "@/lib/auth/oauth-adapter";
import { db } from "@/lib/db";

const googleProvider = isGoogleAuthConfigured()
  ? Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    })
  : null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // webtoon-app과 동일한 User 계정으로 로그인 — 신규 Google 가입자는 oauthAdapter가
  // verified: false 로 생성하므로, 업로드 사이트는 verified=true 인 작가만 접근 가능
  adapter: oauthAdapter,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") return true;

      const googleProfile = profile as { email_verified?: boolean } | undefined;
      if (!user.email || googleProfile?.email_verified !== true) return false;

      const existingUser = await db.user.findUnique({
        where: { id: user.id },
        select: { isSuspended: true, verified: true },
      });
      if (existingUser?.isSuspended === true) return false;

      // 작가 인증(verified)이 안 된 계정은 업로드 사이트 접근 불가
      return existingUser?.verified === true;
    },
  },
  providers: [
    Credentials({
      credentials: {
        userId: { label: "ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const userId =
          typeof credentials?.userId === "string"
            ? credentials.userId.trim()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!userId || !password) {
          return null;
        }

        const user = await db.user.findFirst({
          where: { OR: [{ username: userId }, { id: userId }] },
        });

        if (!user?.passwordHash || !user.emailVerifiedAt) {
          return null;
        }

        if (user.isSuspended) {
          return null;
        }

        // 업로드 사이트는 작가 인증(verified)된 계정만 로그인 가능
        if (!user.verified) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    ...(googleProvider ? [googleProvider] : []),
  ],
});
