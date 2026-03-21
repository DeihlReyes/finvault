"use client";

import { usePathname } from "next/navigation";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/wallets": "Wallets",
  "/budgets": "Budgets",
  "/reports": "Reports",
  "/achievements": "Achievements",
  "/settings": "Settings",
  "/onboarding": "Welcome",
};

export function Header() {
  const pathname = usePathname();
  const title =
    Object.entries(ROUTE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ??
    "FinVault";

  return (
    <header className="md:hidden sticky top-0 z-30 bg-sidebar border-b border-sidebar-border">
      <div className="flex items-center justify-between h-14 px-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-xl font-bold text-primary">FV</span>
      </div>
    </header>
  );
}
