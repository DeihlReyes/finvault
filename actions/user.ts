"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateProfileSchema } from "@/lib/validators/user";
import type { ActionResult } from "@/types/api";

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const raw = {
    displayName: formData.get("displayName") ?? undefined,
    currency: formData.get("currency") ?? "USD",
    timezone: formData.get("timezone") ?? "UTC",
    avatarUrl: formData.get("avatarUrl") ?? undefined,
  };

  const result = updateProfileSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await db.user.update({
    where: { id: auth.supabaseId },
    data: result.data,
  });

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

export async function completeOnboarding(data: {
  displayName: string;
  currency: string;
}): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  await db.user.update({
    where: { id: auth.supabaseId },
    data: {
      displayName: data.displayName,
      currency: data.currency,
      onboardingCompleted: true,
    },
  });

  redirect("/dashboard");
}

export async function clearLevelUpPending(): Promise<void> {
  const auth = await getUser();
  if (!auth) return;

  await db.user.update({
    where: { id: auth.supabaseId },
    data: { levelUpPending: false },
  });
}

export async function deleteAccount(): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const userId = auth.supabaseId;

  // Delete all user data atomically
  await db.$transaction([
    db.xPLog.deleteMany({ where: { userId } }),
    db.achievement.deleteMany({ where: { userId } }),
    db.monthlyChallenge.deleteMany({ where: { userId } }),
    db.netWorthSnapshot.deleteMany({ where: { userId } }),
    db.pushSubscription.deleteMany({ where: { userId } }),
    db.budget.deleteMany({ where: { userId } }),
    db.recurringRule.deleteMany({ where: { userId } }),
    db.transaction.deleteMany({ where: { userId } }),
    db.wallet.deleteMany({ where: { userId } }),
    db.category.deleteMany({ where: { userId } }),
    db.user.delete({ where: { id: userId } }),
  ]);

  // Sign out first, then hard-delete the Auth user via service role
  const supabase = await createClient();
  await supabase.auth.signOut();

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);

  redirect("/login");
}
