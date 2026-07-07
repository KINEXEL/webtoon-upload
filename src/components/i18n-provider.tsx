"use client";

import { createContext, useContext } from "react";

import type { Locale } from "@/lib/i18n/config";
import { DICTIONARIES, type Dict } from "@/lib/i18n/dictionaries";

// 사전에 함수 값이 있어 서버→클라이언트 직렬화가 불가능하므로,
// locale 문자열만 넘기고 사전은 클라이언트 번들에서 직접 조회한다.
const I18nContext = createContext<{ locale: Locale; dict: Dict } | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, dict: DICTIONARIES[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
