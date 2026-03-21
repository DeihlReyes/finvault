"use server";

import { getUser } from "@/lib/auth/get-user";
import { awardXP } from "@/lib/gamification/xp";
import type { ActionResult } from "@/types/api";

export async function triggerExport(
  format: "csv" | "pdf",
  month: number,
  year: number
): Promise<ActionResult<{ url: string }>> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  await awardXP(auth.supabaseId, "EXPORT");

  const url = `/api/export/${format}?month=${month}&year=${year}`;
  return { success: true, data: { url } };
}
