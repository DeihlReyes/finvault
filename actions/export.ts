import { awardXP } from "@/lib/gamification/xp";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import type { ActionResult } from "@/types/api";

export async function triggerExport(
  _format: "csv" | "pdf",
  _month: number,
  _year: number
): Promise<ActionResult<void>> {
  await awardXP(LOCAL_USER_ID, "EXPORT");
  return { success: true, data: undefined };
}
