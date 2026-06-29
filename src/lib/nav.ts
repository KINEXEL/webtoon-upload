import { BookOpen, Crown, Receipt, Wallet, type LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "내 작품", href: "/series", icon: BookOpen },
  { label: "결제내역", href: "/payments", icon: Receipt },
  { label: "멤버십내역", href: "/memberships", icon: Crown },
  { label: "정산내역", href: "/settlement", icon: Wallet },
];
