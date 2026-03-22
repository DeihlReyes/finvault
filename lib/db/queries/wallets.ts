import { getDb } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import { wallets } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { walletSchema } from "@/lib/validators/wallet";
import { awardXP } from "@/lib/gamification/xp";
import { checkAndAwardAchievement } from "@/lib/gamification/achievements";
import type { ActionResult } from "@/types/api";

export async function getWallets() {
  const db = getDb();
  return db
    .select()
    .from(wallets)
    .where(
      and(eq(wallets.userId, LOCAL_USER_ID), eq(wallets.isArchived, false))
    )
    .orderBy(wallets.createdAt);
}

export async function createWallet(
  input: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  const result = walletSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const data = result.data;

  await db.insert(wallets).values({
    id,
    userId: LOCAL_USER_ID,
    name: data.name,
    type: data.type,
    balance: String(data.balance ?? 0),
    currency: data.currency ?? "USD",
    color: data.color ?? "#6C47FF",
    icon: data.icon ?? "wallet",
  });

  // Gamification: first wallet achievement
  const walletCount = await db
    .select({ id: wallets.id })
    .from(wallets)
    .where(eq(wallets.userId, LOCAL_USER_ID));

  if (walletCount.length === 1) {
    Promise.all([
      awardXP(LOCAL_USER_ID, "FIRST_WALLET"),
      checkAndAwardAchievement(LOCAL_USER_ID, "WALLET_WIZARD"),
    ]).catch(console.error);
  }

  return { success: true, data: { id } };
}

export async function updateWallet(
  id: string,
  input: Record<string, unknown>
): Promise<ActionResult> {
  const result = walletSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const db = getDb();
  const data = result.data;

  await db
    .update(wallets)
    .set({
      name: data.name,
      type: data.type,
      balance: String(data.balance ?? 0),
      currency: data.currency ?? "USD",
      color: data.color ?? "#6C47FF",
      icon: data.icon ?? "wallet",
      updatedAt: new Date(),
    })
    .where(and(eq(wallets.id, id), eq(wallets.userId, LOCAL_USER_ID)));

  return { success: true, data: undefined };
}

export async function archiveWallet(id: string): Promise<ActionResult> {
  const db = getDb();

  await db
    .update(wallets)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(and(eq(wallets.id, id), eq(wallets.userId, LOCAL_USER_ID)));

  return { success: true, data: undefined };
}
