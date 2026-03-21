"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { TIPS } from "@/lib/onboarding/tips";

export async function dismissTip(tipId: string): Promise<void> {
  const auth = await getUser();
  if (!auth) return;

  await db.user.update({
    where: { id: auth.supabaseId },
    data: { seenTips: { push: tipId } },
  });

  revalidatePath("/", "layout");
}

export async function dismissWelcomeModal(): Promise<void> {
  return dismissTip(TIPS.WELCOME_MODAL);
}
