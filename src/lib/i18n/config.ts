/** 업로드 사이트 UI 언어 설정. 콘텐츠 언어(ContentLanguage)와는 별개다. */
export const LOCALES = ["ko", "en", "ja", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ko";

/** 선택한 UI 언어를 저장하는 쿠키 이름 */
export const LOCALE_COOKIE = "upload_locale";

/** 언어 선택 메뉴에 표시할 각 언어의 자국어 이름 */
export const LOCALE_NAMES: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  es: "Español",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
