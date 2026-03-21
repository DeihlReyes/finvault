"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validators/category";
import type { ActionResult } from "@/types/api";

export async function createCategory(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const result = categorySchema.safeParse({
    name: formData.get("name"),
    emoji: formData.get("emoji") ?? "💰",
    color: formData.get("color") ?? "#6C47FF",
  });

  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const category = await db.category.create({
    data: { userId: auth.supabaseId, ...result.data },
  });

  revalidatePath("/settings");
  revalidatePath("/transactions");
  return { success: true, data: { id: category.id } };
}

export async function updateCategory(
  id: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const result = categorySchema.safeParse({
    name: formData.get("name"),
    emoji: formData.get("emoji") ?? "💰",
    color: formData.get("color") ?? "#6C47FF",
  });

  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await db.category.updateMany({
    where: { id, userId: auth.supabaseId },
    data: result.data,
  });

  revalidatePath("/settings");
  revalidatePath("/transactions");
  return { success: true, data: { id } };
}

export async function archiveCategory(id: string): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  // Block archiving if transactions exist
  const txCount = await db.transaction.count({
    where: { categoryId: id, userId: auth.supabaseId },
  });
  if (txCount > 0) {
    return {
      success: false,
      error: `Cannot archive: ${txCount} transaction(s) use this category`,
    };
  }

  await db.category.updateMany({
    where: { id, userId: auth.supabaseId },
    data: { isArchived: true },
  });

  revalidatePath("/settings");
  revalidatePath("/transactions");
  return { success: true, data: undefined };
}
