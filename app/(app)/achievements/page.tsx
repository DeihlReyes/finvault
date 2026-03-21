import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import type { AchievementType } from "@/lib/generated/prisma/enums";

export const metadata = { title: "Achievements — FinVault" };

const ACHIEVEMENT_META: Record<AchievementType, { label: string; description: string; emoji: string }> = {
  FIRST_TRANSACTION: { label: "First Steps", description: "Record your first transaction", emoji: "🎯" },
  BUDGET_BUILDER: { label: "Budget Builder", description: "Create your first budget", emoji: "📊" },
  WALLET_WIZARD: { label: "Wallet Wizard", description: "Set up your first wallet", emoji: "👛" },
  STREAK_WARRIOR: { label: "Streak Warrior", description: "Maintain a 7-day streak", emoji: "🔥" },
  UNDER_BUDGET: { label: "Under Budget", description: "Stay under budget for a month", emoji: "✅" },
  EXPORT_PRO: { label: "Export Pro", description: "Export your financial data", emoji: "📤" },
  SAVER_OF_THE_MONTH: { label: "Saver of the Month", description: "Save 20% of income in a month", emoji: "💎" },
  CENTURY_STREAK: { label: "Century Streak", description: "Reach a 100-day streak", emoji: "💯" },
};

async function AchievementsContent() {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const earned = await db.achievement.findMany({
    where: { userId: auth.supabaseId },
  });
  const earnedTypes = new Set(earned.map((a) => a.type));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {earned.length} / {Object.keys(ACHIEVEMENT_META).length} unlocked
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.keys(ACHIEVEMENT_META) as AchievementType[]).map((type) => {
          const meta = ACHIEVEMENT_META[type];
          const isEarned = earnedTypes.has(type);
          return (
            <div
              key={type}
              className={`bg-card border rounded-xl p-4 flex items-center gap-4 transition-all ${
                isEarned ? "border-primary/40" : "border-border opacity-60"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                isEarned ? "bg-primary/15" : "bg-secondary"
              }`}>
                {isEarned ? meta.emoji : "🔒"}
              </div>
              <div>
                <p className="font-medium text-sm">{meta.label}</p>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Achievements 🏆</h2>
      <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />)}</div>}>
        <AchievementsContent />
      </Suspense>
    </div>
  );
}
