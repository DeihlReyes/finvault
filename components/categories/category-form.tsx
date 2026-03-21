"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCategory, updateCategory } from "@/actions/categories";
import { toast } from "sonner";
import type { ActionResult } from "@/types/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type CatResult = ActionResult<{ id: string }>;

type Props = {
  onSuccess?: () => void;
  editId?: string;
  initialValues?: { name: string; emoji: string; color: string };
};

const PALETTE = [
  "#6C47FF", "#F97316", "#10B981", "#EC4899",
  "#EF4444", "#F59E0B", "#22C55E", "#6366F1",
  "#8B5CF6", "#6B7280",
];

const EMOJI_SUGGESTIONS = ["🍔", "🚌", "🏠", "🎮", "❤️", "🛍️", "💰", "💼", "💻", "📦", "✈️", "🎓", "🐾", "🎵"];

export function CategoryForm({ onSuccess, editId, initialValues }: Props) {
  const prevState = useRef<CatResult | null>(null);

  const action = editId
    ? updateCategory.bind(null, editId)
    : createCategory;

  const [state, formAction, pending] = useActionState<CatResult | null, FormData>(
    action,
    null
  );

  useEffect(() => {
    if (state && state !== prevState.current) {
      prevState.current = state;
      if (state.success) {
        toast.success(editId ? "Category updated!" : "Category created!");
        onSuccess?.();
      } else if (state.error) {
        toast.error(state.error);
      }
    }
  }, [state, editId, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {/* Emoji */}
      <div className="space-y-2">
        <Label>Emoji</Label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_SUGGESTIONS.map((e) => (
            <label key={e} className="cursor-pointer">
              <input
                type="radio"
                name="emoji"
                value={e}
                defaultChecked={e === (initialValues?.emoji ?? "💰")}
                className="sr-only"
              />
              <span className="block w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/10 text-lg transition-colors">
                {e}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          maxLength={30}
          defaultValue={initialValues?.name}
          placeholder="e.g. Groceries"
          className="h-9 w-full"
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2 flex-wrap">
          {PALETTE.map((color) => (
            <label key={color} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={color}
                defaultChecked={color === (initialValues?.color ?? "#6C47FF")}
                className="sr-only"
              />
              <span
                className="block w-7 h-7 rounded-full ring-2 ring-offset-2 ring-offset-background ring-transparent has-[:checked]:ring-white transition-all"
                style={{ backgroundColor: color }}
              />
            </label>
          ))}
        </div>
      </div>

      {state && !state.success && state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full h-10">
        {pending ? "Saving…" : editId ? "Update" : "Create Category"}
      </Button>
    </form>
  );
}
