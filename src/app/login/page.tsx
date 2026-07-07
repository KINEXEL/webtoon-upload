import { redirect } from "next/navigation";

import {
  facebookLoginAction,
  googleLoginAction,
  loginAction,
  twitterLoginAction,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { isFacebookAuthConfigured } from "@/lib/auth/facebook";
import { isGoogleAuthConfigured } from "@/lib/auth/google";
import { isTwitterAuthConfigured } from "@/lib/auth/twitter";
import { getSessionUploader } from "@/lib/auth/session";
import { getDict } from "@/lib/i18n/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  const dict = await getDict();

  // DB까지 확인해서 진짜 유효(verified, 비정지)한 세션일 때만 / 로 보낸다.
  // JWT만 유효하고 DB 기준으로는 막힌 계정은 여기서 그냥 로그인 폼을 보여줘야
  // /login ↔ / 무한 리다이렉트 루프를 피할 수 있다.
  const user = await getSessionUploader();
  if (user && !user.isSuspended && user.verified) {
    redirect(callbackUrl ?? "/");
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">COMIQUE Upload</CardTitle>
          <CardDescription>{dict.login.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="flex flex-col gap-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="userId">{dict.login.userId}</Label>
              <Input
                id="userId"
                name="userId"
                type="text"
                placeholder={dict.login.userId}
                autoComplete="username"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{dict.login.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">
                {dict.login.errors[error] ?? dict.login.errors.fallback}
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              {dict.login.submit}
            </Button>
          </form>
          {isGoogleAuthConfigured() ||
          isTwitterAuthConfigured() ||
          isFacebookAuthConfigured() ? (
            <>
              <div className="my-4 flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">{dict.common.or}</span>
                <Separator className="flex-1" />
              </div>
              <div className="flex flex-col gap-2">
                {isGoogleAuthConfigured() ? (
                  <form action={googleLoginAction}>
                    <Button type="submit" variant="outline" className="w-full">
                      {dict.login.google}
                    </Button>
                  </form>
                ) : null}
                {isTwitterAuthConfigured() ? (
                  <form action={twitterLoginAction}>
                    <Button type="submit" variant="outline" className="w-full">
                      {dict.login.twitter}
                    </Button>
                  </form>
                ) : null}
                {isFacebookAuthConfigured() ? (
                  <form action={facebookLoginAction}>
                    <Button type="submit" variant="outline" className="w-full">
                      {dict.login.facebook}
                    </Button>
                  </form>
                ) : null}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
