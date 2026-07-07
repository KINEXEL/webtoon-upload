"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function UploaderSidebar() {
  const pathname = usePathname();
  const { dict } = useI18n();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center border-b px-5">
        <Image
          src="/type-basic.svg"
          alt="COMIQUE"
          width={147}
          height={40}
          priority
          className="h-6 w-auto"
        />
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
                  )}
                >
                  <Icon className="size-4" />
                  {dict.nav[item.labelKey]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
