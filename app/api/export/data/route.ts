import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";

export async function GET() {
  const auth = await getUser();
  if (!auth) return new NextResponse("Unauthorized", { status: 401 });

  const userId = auth.supabaseId;

  const [
    user,
    wallets,
    categories,
    transactions,
    recurringRules,
    budgets,
    achievements,
    monthlyChallenges,
    xpLogs,
    netWorthSnapshots,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        currency: true,
        timezone: true,
        totalXP: true,
        level: true,
        streak: true,
        createdAt: true,
      },
    }),
    db.wallet.findMany({ where: { userId } }),
    db.category.findMany({ where: { userId } }),
    db.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    db.recurringRule.findMany({ where: { userId } }),
    db.budget.findMany({ where: { userId } }),
    db.achievement.findMany({ where: { userId } }),
    db.monthlyChallenge.findMany({ where: { userId } }),
    db.xPLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    db.netWorthSnapshot.findMany({ where: { userId }, orderBy: { date: "desc" } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    wallets,
    categories,
    transactions,
    recurringRules,
    budgets,
    achievements,
    monthlyChallenges,
    xpLogs,
    netWorthSnapshots,
  };

  const filename = `finvault-data-${new Date().toISOString().split("T")[0]}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
