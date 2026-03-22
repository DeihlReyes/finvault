"use client";

import { useAchievements, useUser } from "@/lib/hooks/use-db-queries";
import type { AchievementType } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FeatureTip } from "@/components/onboarding/feature-tip";
import { TIPS } from "@/lib/onboarding/tips";

const ACHIEVEMENT_META: Record<
  AchievementType,
  { label: string; description: string; emoji: string }
> = {
  FIRST_TRANSACTION: {
    label: "First Steps",
    description: "Record your first transaction",
    emoji: "🎯",
  },
  BUDGET_BUILDER: {
    label: "Budget Builder",
    description: "Create your first budget",
    emoji: "📊",
  },
  WALLET_WIZARD: {
    label: "Wallet Wizard",
    description: "Set up your first wallet",
    emoji: "👛",
  },
  STREAK_WARRIOR: {
    label: "Streak Warrior",
    description: "Maintain a 7-day streak",
    emoji: "🔥",
  },
  UNDER_BUDGET: {
    label: "Under Budget",
    description: "Stay under budget for a month",
    emoji: "✅",
  },
  EXPORT_PRO: {
    label: "Export Pro",
    description: "Export your financial data",
    emoji: "📤",
  },
  SAVER_OF_THE_MONTH: {
    label: "Saver of the Month",
    description: "Save 20% of income in a month",
    emoji: "💎",
  },
  CENTURY_STREAK: {
    label: "Century Streak",
    description: "Reach a 100-day streak",
    emoji: "💯",
  },
};

export default function AchievementsPage() {
  const { data: earned = [], isLoading } = useAchievements();
  const { data: user } = useUser();

  const earnedTypes = new Set(earned.map((a) => a.type));
  const total = Object.keys(ACHIEVEMENT_META).length;
  const seenTips = user?.seenTips ?? [];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 mx-auto space-y-4">
        <h2 className="text-xl font-bold">Achievements 🏆</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 mx-auto space-y-4">
      <h2 className="text-xl font-bold">Achievements 🏆</h2>
      <FeatureTip
        tipId={TIPS.ACHIEVEMENTS_PANEL}
        title="Unlock achievements"
        description="Complete actions in FinVault — like logging transactions and building streaks — to earn badges and bonus XP."
        seenTips={seenTips}
      />
      <p className="text-sm text-muted-foreground">
        {earned.length} / {total} unlocked
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.keys(ACHIEVEMENT_META) as AchievementType[]).map((type) => {
          const meta = ACHIEVEMENT_META[type];
          const isEarned = earnedTypes.has(type);
          return (
            <Card
              key={type}
              className={`transition-opacity ${isEarned ? "border-primary/40" : "opacity-50"}`}
            >
              <CardContent className="pt-4 pb-4 flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 ${
                    isEarned ? "bg-primary/15" : "bg-secondary"
                  }`}
                >
                  {isEarned ? meta.emoji : "🔒"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{meta.label}</p>
                    {isEarned && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        Earned
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {meta.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
