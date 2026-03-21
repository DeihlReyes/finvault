"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/transactions", label: "Txns", icon: "↕️" },
  { href: "/wallets", label: "Wallets", icon: "👛" },
  { href: "/budgets", label: "Budgets", icon: "📊" },
  { href: "/reports", label: "Reports", icon: "📈" },
  { href: "/achievements", label: "Trophies", icon: "🏆" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  const activeIndex = TABS.findIndex(
    (t) => pathname === t.href || pathname.startsWith(`${t.href}/`)
  );

  return (
    <nav className="md:hidden fixed bottom-4 inset-x-0 z-40 flex justify-center pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-2xl bg-sidebar/90 backdrop-blur-md border border-sidebar-border shadow-xl shadow-black/20 overflow-x-auto scrollbar-none max-w-[calc(100vw-2rem)]">
        {TABS.map((tab, i) => {
          const isActive = i === activeIndex;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center justify-center shrink-0 w-[52px] h-[52px] rounded-xl"
            >
              {/* Sliding background pill */}
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-primary/15 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Icon */}
              <motion.span
                animate={{
                  scale: isActive ? 1.2 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative z-10 text-lg leading-none"
              >
                {tab.icon}
              </motion.span>

              {/* Label */}
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.5,
                  y: isActive ? 0 : 1,
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "relative z-10 text-[9px] font-semibold leading-none mt-1 tracking-wide",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </motion.span>

              {/* Active dot */}
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
