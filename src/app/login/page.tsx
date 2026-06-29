import { googleLoginAction, loginAction } from "@/app/actions/auth";
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
import { isGoogleAuthConfigured } from "@/lib/auth/google";

const ERRORS: Record<string, string> = {
  missing: "아이디와 비밀번호를 입력하세요.",
  invalid: "아이디 또는 비밀번호가 올바르지 않습니다.",
  suspended: "정지된 계정입니다.",
  not_verified: "작가 인증이 필요합니다. 인증이 완료된 후 이용해 주세요.",
  google_unavailable: "Google 로그인을 사용할 수 없습니다.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">COMIQUE Upload</CardTitle>
          <CardDescription>
            webtoon 작가 계정으로 로그인하세요. 인증(verified)된 작가만
            이용할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="flex flex-col gap-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="userId">아이디</Label>
              <Input
                id="userId"
                name="userId"
                type="text"
                placeholder="아이디"
                autoComplete="username"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">비밀번호</Label>
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
                {ERRORS[error] ?? "로그인에 실패했습니다."}
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              로그인
            </Button>
          </form>
          {isGoogleAuthConfigured() ? (
            <>
              <div className="my-4 flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">또는</span>
                <Separator className="flex-1" />
              </div>
              <form action={googleLoginAction}>
                <Button type="submit" variant="outline" className="w-full">
                  Google로 로그인
                </Button>
              </form>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
