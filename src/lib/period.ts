import { endOfMonth, format, parse, startOfMonth } from "date-fns";
import { ko } from "date-fns/locale";

export type Period = {
  mode: "all" | "month";
  /** YYYY-MM, "all"일 때는 null */
  month: string | null;
  start: Date | null;
  end: Date | null;
  label: string;
};

/** ?range=all|month&month=YYYY-MM 파싱. 미지정 시 기본값 = 이번달 */
export function resolvePeriod(searchParams: {
  range?: string;
  month?: string;
}): Period {
  if (searchParams.range === "all") {
    return { mode: "all", month: null, start: null, end: null, label: "전체" };
  }

  const now = new Date();
  const monthParam = searchParams.month;
  const reference =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam)
      ? parse(monthParam, "yyyy-MM", now)
      : now;

  const start = startOfMonth(reference);
  const end = endOfMonth(reference);

  return {
    mode: "month",
    month: format(reference, "yyyy-MM"),
    start,
    end,
    label: format(reference, "yyyy년 M월", { locale: ko }),
  };
}

/** Prisma where 절에 바로 끼워 넣을 날짜 범위 (전체보기면 undefined) */
export function periodDateFilter(period: Period) {
  if (period.mode === "all" || !period.start || !period.end) return undefined;
  return { gte: period.start, lte: period.end };
}
