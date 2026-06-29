"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  /** 현재 라우트 pathname (예: "/payments") */
  basePath: string;
};

type Tab = "THIS_MONTH" | "CUSTOM" | "ALL";

const TABS: { value: Tab; label: string }[] = [
  { value: "THIS_MONTH", label: "이번달" },
  { value: "CUSTOM", label: "특정 월" },
  { value: "ALL", label: "전체보기" },
];

export function PeriodToggle({ basePath }: Props) {
  const router = useRouter();
  const params = useSearchParams();

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
    router.push(`${basePath}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex w-fit rounded-lg bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              if (tab.value === "ALL") push("all", null);
              else if (tab.value === "THIS_MONTH") push("month", null);
              else push("month", month || formatThisMonth());
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              activeTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
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
