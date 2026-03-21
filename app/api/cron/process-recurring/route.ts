import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeNextDueDate } from "@/lib/recurring/processor";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Query all due, non-paused rules
  const dueRules = await db.recurringRule.findMany({
    where: {
      nextDueDate: { lte: now },
      isPaused: false,
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: { user: { select: { currency: true } } },
  });

  let processed = 0;
  let errors = 0;

  // Process sequentially to avoid connection pool exhaustion
  for (const rule of dueRules) {
    try {
      await db.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            userId: rule.userId,
            walletId: rule.walletId,
            categoryId: rule.categoryId,
            amount: rule.amount,
            type: rule.type,
            date: rule.nextDueDate,
            note: `Auto: ${rule.name}`,
            isRecurringGenerated: true,
          },
        });

        // Update wallet balance
        if (rule.type === "INCOME") {
          await tx.wallet.update({
            where: { id: rule.walletId },
            data: { balance: { increment: rule.amount } },
          });
        } else if (rule.type === "EXPENSE") {
          await tx.wallet.update({
            where: { id: rule.walletId },
            data: { balance: { decrement: rule.amount } },
          });
        }

        const nextDueDate = computeNextDueDate(rule.nextDueDate, rule.frequency);
        await tx.recurringRule.update({
          where: { id: rule.id },
          data: { nextDueDate },
        });
      });
      processed++;
    } catch (err) {
      console.error(`Failed to process recurring rule ${rule.id}:`, err);
      errors++;
    }
  }

  // Record net worth snapshot for all users processed
  const userIds = [...new Set(dueRules.map((r) => r.userId))];
  for (const userId of userIds) {
    try {
      const wallets = await db.wallet.findMany({
        where: { userId, isArchived: false },
        select: { balance: true },
      });
      const totalValue = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      await db.netWorthSnapshot.upsert({
        where: { userId_date: { userId, date: today } },
        create: { userId, date: today, totalValue },
        update: { totalValue },
      });
    } catch {
      // Non-critical
    }
  }

  return NextResponse.json({ processed, errors, total: dueRules.length });
}
