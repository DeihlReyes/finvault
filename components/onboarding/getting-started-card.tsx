import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  hasDisplayName: boolean;
  hasWallet: boolean;
  hasTransaction: boolean;
  hasBudget: boolean;
};

const ITEMS = [
  {
    key: "profile" as const,
    label: "Set up your profile",
    href: "/settings",
    emoji: "👤",
  },
  {
    key: "wallet" as const,
    label: "Add a wallet",
    href: "/wallets",
    emoji: "👛",
  },
  {
    key: "transaction" as const,
    label: "Log your first transaction",
    href: "/transactions",
    emoji: "💳",
  },
  {
    key: "budget" as const,
    label: "Create a budget",
    href: "/budgets",
    emoji: "📊",
  },
  {
    key: "achievements" as const,
    label: "Check your achievements",
    href: "/achievements",
    emoji: "🏆",
    alwaysIncomplete: true,
  },
];

export function GettingStartedCard({
  hasDisplayName,
  hasWallet,
  hasTransaction,
  hasBudget,
}: Props) {
  const completionMap: Record<string, boolean> = {
    profile: hasDisplayName,
    wallet: hasWallet,
    transaction: hasTransaction,
    budget: hasBudget,
    achievements: false,
  };

  const completedCount = ITEMS.filter(
    (item) => !item.alwaysIncomplete && completionMap[item.key]
  ).length;

  // Hide card once all non-achievement items are done
  if (completedCount === ITEMS.filter((i) => !i.alwaysIncomplete).length) {
    return null;
  }

  const progressPct = (completedCount / (ITEMS.length - 1)) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Getting Started</CardTitle>
          <span className="text-xs text-muted-foreground">
            {completedCount} / {ITEMS.length - 1} done
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        {ITEMS.map((item) => {
          const done = !item.alwaysIncomplete && completionMap[item.key];
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-secondary/60 ${
                done ? "opacity-50" : ""
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 border ${
                  done
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-transparent"
                }`}
              >
                {done ? "✓" : ""}
              </span>
              <span className="flex-1">
                {item.emoji} {item.label}
              </span>
              {!done && (
                <span className="text-muted-foreground text-xs">→</span>
              )}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
