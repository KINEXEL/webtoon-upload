import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { DICTIONARIES, type Dict } from "./dictionaries";

/** 쿠키에서 UI 언어를 읽는다. 서버 컴포넌트/서버 액션 전용. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDict(): Promise<Dict> {
  return DICTIONARIES[await getLocale()];
}
