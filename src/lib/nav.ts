import { BookOpen, Crown, Receipt, Wallet, type LucideIcon } from "lucide-react";

import type { Dict } from "@/lib/i18n/dictionaries";

export type NavItem = {
  /** dict.nav 의 키 — 라벨은 선택된 UI 언어 사전에서 조회 */
  labelKey: keyof Dict["nav"];
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { labelKey: "mySeries", href: "/series", icon: BookOpen },
  { labelKey: "payments", href: "/payments", icon: Receipt },
  { labelKey: "memberships", href: "/memberships", icon: Crown },
  { labelKey: "settlement", href: "/settlement", icon: Wallet },
];
