"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { walletSchema } from "@/lib/validators/wallet";
import { awardXP } from "@/lib/gamification/xp";
import { checkAndAwardAchievement } from "@/lib/gamification/achievements";
import type { ActionResult } from "@/types/api";

export async function createWallet(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    currency: formData.get("currency") ?? auth.user.currency,
    color: formData.get("color") ?? "#6C47FF",
    icon: formData.get("icon") ?? "wallet",
  };

  const result = walletSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const userId = auth.supabaseId;

  const wallet = await db.wallet.create({
    data: { userId, ...result.data },
  });

  // Award XP for first wallet
  const walletCount = await db.wallet.count({ where: { userId } });
  if (walletCount === 1) {
    await awardXP(userId, "FIRST_WALLET");
    await checkAndAwardAchievement(userId, "WALLET_WIZARD");
  }

  revalidatePath("/wallets");
  revalidatePath("/dashboard");
  return { success: true, data: { id: wallet.id } };
}

export async function updateWallet(
  id: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    currency: formData.get("currency") ?? auth.user.currency,
    color: formData.get("color") ?? "#6C47FF",
    icon: formData.get("icon") ?? "wallet",
  };

  const result = walletSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await db.wallet.updateMany({
    where: { id, userId: auth.supabaseId },
    data: result.data,
  });

  revalidatePath("/wallets");
  return { success: true, data: { id } };
}

export async function archiveWallet(id: string): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  await db.wallet.updateMany({
    where: { id, userId: auth.supabaseId },
    data: { isArchived: true },
  });

  revalidatePath("/wallets");
  return { success: true, data: undefined };
}
