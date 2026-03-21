import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(50, "Name must be 50 characters or less"),
  emoji: z.string().max(10).default("💰"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color")
    .default("#6C47FF"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
