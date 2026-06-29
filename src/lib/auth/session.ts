import { cache } from "react";
import { redirect } from "next/navigation";
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

/** 로그인 + verified(작가 인증) 상태를 검사하고, 아니면 throw. 서버 액션(form action)에서 사용 — 페이지 렌더링에는 requireVerifiedUploaderOrRedirect 사용 */
export async function requireVerifiedUploader(): Promise<User> {
  const user = await getSessionUploader();
  if (!user || user.isSuspended || !user.verified) {
    throw new Error("Unauthorized");
  }
  return user;
}

/** 페이지 컴포넌트용 — 인증 실패 시 throw 대신 /login으로 리다이렉트 (세션 쿠키 깨짐 등으로 layout 가드를 비정상적으로 통과한 경우의 방어선) */
export async function requireVerifiedUploaderOrRedirect(): Promise<User> {
  const user = await getSessionUploader();
  if (!user || user.isSuspended || !user.verified) {
    redirect("/login");
  }
  return user;
}
