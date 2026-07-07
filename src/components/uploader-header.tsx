import Image from "next/image";
import type { User } from "@kinexel/webtoon-db";

import { logoutAction } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { getDict } from "@/lib/i18n/server";

export async function UploaderHeader({ user }: { user: User }) {
  const dict = await getDict();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-5">
      <Image
        src="/type-basic.svg"
        alt="COMIQUE"
        width={147}
        height={40}
        priority
        className="h-5 w-auto md:hidden"
      />
      <div className="ml-auto flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <LanguageSwitcher />
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            {dict.common.logout}
          </Button>
        </form>
      </div>
    </header>
  );
}
