import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  emoji: z.string().max(10).default("💰"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6C47FF"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
