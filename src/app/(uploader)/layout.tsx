import { redirect } from "next/navigation";

import { UploaderHeader } from "@/components/uploader-header";
import { getSessionUploader } from "@/lib/auth/session";

export default async function UploaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUploader();

  // 미들웨어(proxy.ts)가 1차로 막지만, 정지/미인증 계정은 여기서도 방어
  if (!user || user.isSuspended || !user.verified) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh w-full flex-col">
      <UploaderHeader user={user} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
