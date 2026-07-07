"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  /** 현재 라우트 pathname (예: "/payments") */
  basePath: string;
};

type Tab = "THIS_MONTH" | "CUSTOM" | "ALL";

const TABS: Tab[] = ["THIS_MONTH", "CUSTOM", "ALL"];

export function PeriodToggle({ basePath }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const { dict } = useI18n();

  const tabLabel: Record<Tab, string> = {
    THIS_MONTH: dict.period.thisMonth,
    CUSTOM: dict.period.custom,
    ALL: dict.period.all,
  };

  const range = params.get("range") === "all" ? "all" : "month";
  const month = params.get("month") ?? "";
  const activeTab: Tab = range === "all" ? "ALL" : month ? "CUSTOM" : "THIS_MONTH";

  function push(nextRange: string, nextMonth: string | null) {
    const next = new URLSearchParams(params.toString());
    if (nextRange === "all") {
      next.set("range", "all");
      next.delete("month");
    } else {
      next.delete("range");
      if (nextMonth) next.set("month", nextMonth);
      else next.delete("month");
    }
    const qs = next.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
    // force-dynamic 페이지라도 client Router Cache 때문에 쿼리만 바뀌면
    // 서버 컴포넌트가 다시 안 돌 수 있어, 명시적으로 새로고침해 데이터를 갱신한다.
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex w-fit rounded-lg bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              if (tab === "ALL") push("all", null);
              else if (tab === "THIS_MONTH") push("month", null);
              else push("month", month || formatThisMonth());
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tabLabel[tab]}
          </button>
        ))}
      </div>

      {range === "month" && month ? (
        <Input
          type="month"
          value={month}
          onChange={(e) => push("month", e.target.value)}
          className="w-40"
        />
      ) : null}
    </div>
  );
}

function formatThisMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
