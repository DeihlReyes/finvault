"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  transactions: "Transactions",
  wallets: "Wallets",
  budgets: "Budgets",
  reports: "Reports",
  achievements: "Achievements",
  settings: "Settings",
  onboarding: "Welcome",
};

function labelFor(segment: string): string {
  return SEGMENT_LABELS[segment] ?? "Detail";
}

export function DirectoryBreadcrumb() {
  const pathname = usePathname();

  // Build path segments, skipping empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Accumulate hrefs as we go: ["wallets", "abc123"] → ["/wallets", "/wallets/abc123"]
  const crumbs = segments.map((seg, i) => ({
    label: labelFor(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <Fragment key={crumb.href}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className="font-bold text-sm">
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
