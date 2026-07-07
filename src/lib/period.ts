import { endOfMonth, format, parse, startOfMonth } from "date-fns";
import { enUS as dfEn, es as dfEs, ja as dfJa, ko as dfKo } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

export type Period = {
  mode: "all" | "month";
  /** YYYY-MM, "all"일 때는 null */
  month: string | null;
  start: Date | null;
  end: Date | null;
  label: string;
};

/** UI 언어별 월 라벨 포맷 (예: 2026년 7월 / July 2026 / 2026年7月 / julio de 2026) */
const MONTH_LABEL: Record<Locale, { locale: DateFnsLocale; fmt: string }> = {
  ko: { locale: dfKo, fmt: "yyyy년 M월" },
  en: { locale: dfEn, fmt: "MMMM yyyy" },
  ja: { locale: dfJa, fmt: "yyyy年M月" },
  es: { locale: dfEs, fmt: "MMMM 'de' yyyy" },
};

const ALL_LABEL: Record<Locale, string> = {
  ko: "전체",
  en: "All time",
  ja: "全期間",
  es: "Todo",
};

/** ?range=all|month&month=YYYY-MM 파싱. 미지정 시 기본값 = 이번달 */
export function resolvePeriod(
  searchParams: {
    range?: string;
    month?: string;
  },
  uiLocale: Locale = DEFAULT_LOCALE,
): Period {
  if (searchParams.range === "all") {
    return {
      mode: "all",
      month: null,
      start: null,
      end: null,
      label: ALL_LABEL[uiLocale],
    };
  }

  const now = new Date();
  const monthParam = searchParams.month;
  const reference =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam)
      ? parse(monthParam, "yyyy-MM", now)
      : now;

  const start = startOfMonth(reference);
  const end = endOfMonth(reference);
  const { locale, fmt } = MONTH_LABEL[uiLocale];

  return {
    mode: "month",
    month: format(reference, "yyyy-MM"),
    start,
    end,
    label: format(reference, fmt, { locale }),
  };
}

/** Prisma where 절에 바로 끼워 넣을 날짜 범위 (전체보기면 undefined) */
export function periodDateFilter(period: Period) {
  if (period.mode === "all" || !period.start || !period.end) return undefined;
  return { gte: period.start, lte: period.end };
}
