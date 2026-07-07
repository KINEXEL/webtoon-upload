import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { getDict } from "@/lib/i18n/server";

export async function PageHeader({
  title,
  description,
  action,
  backHref,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  backHref?: string;
}) {
  const dict = await getDict();

  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex items-center gap-2">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={dict.common.back}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </Link>
        ) : null}
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}
