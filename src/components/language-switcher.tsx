"use client";

import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";

import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, type Locale } from "@/lib/i18n/config";

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale } = useI18n();

  function select(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // 서버 컴포넌트가 새 locale 쿠키로 다시 렌더링되도록 Router Cache 를 비운다
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <Globe className="size-4" />
        {LOCALE_NAMES[locale]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((item) => (
          <DropdownMenuItem key={item} onClick={() => select(item)}>
            <span className="flex-1">{LOCALE_NAMES[item]}</span>
            {item === locale ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
