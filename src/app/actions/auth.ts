"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { isGoogleAuthConfigured } from "@/lib/auth/google";
import { db } from "@/lib/db";

export async function loginAction(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/") || "/";

  if (!userId || !password) {
    redirect(`/login?error=missing`);
  }

  // 비밀번호 비교 전에 verified 여부를 먼저 확인해 구체적인 에러를 보여준다.
  const user = await db.user.findFirst({
    where: { OR: [{ username: userId }, { id: userId }] },
    select: { verified: true, isSuspended: true },
  });

  if (user && user.isSuspended) {
    redirect(`/login?error=suspended`);
  }

  if (user && !user.verified) {
    redirect(`/login?error=not_verified`);
  }

  try {
    await signIn("credentials", {
      userId,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=invalid`);
    }
    throw error;
  }
}

export async function googleLoginAction(): Promise<void> {
  if (!isGoogleAuthConfigured()) {
    redirect(`/login?error=google_unavailable`);
  }

  await signIn("google", { redirectTo: "/" });
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
