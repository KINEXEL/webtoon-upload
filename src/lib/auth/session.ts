import { cache } from "react";
import type { User } from "@kinexel/webtoon-db";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const getSessionUserId = cache(async (): Promise<string | null> => {
  try {
    const session = await auth();
    return session?.user?.id ?? null;
  } catch {
    // 손상/만료된 세션 쿠키(예: AUTH_SECRET 변경 후 구 쿠키) → 비로그인 취급
    return null;
  }
});

export const getSessionUploader = cache(async (): Promise<User | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return db.user.findUnique({ where: { id: userId } });
});

/** 로그인 + verified(작가 인증) 상태를 검사하고, 아니면 throw */
export async function requireVerifiedUploader(): Promise<User> {
  const user = await getSessionUploader();
  if (!user || user.isSuspended || !user.verified) {
    throw new Error("Unauthorized");
  }
  return user;
}
