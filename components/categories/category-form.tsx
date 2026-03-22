"use client";
"use no memo";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { categorySchema } from "@/lib/validators/category";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
type CategoryInput = z.output<typeof categorySchema>;
import { createCategory, updateCategory } from "@/actions/categories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

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

const EMOJI_SUGGESTIONS = [
  "🍔", "🚌", "🏠", "🎮", "❤️", "🛍️",
  "💰", "💼", "💻", "📦", "✈️", "🎓",
  "🐾", "🎵",
];

export function CategoryForm({ onSuccess, editId, initialValues }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema) as Resolver<CategoryInput>,
    defaultValues: {
      name: initialValues?.name ?? "",
      emoji: initialValues?.emoji ?? "💰",
      color: initialValues?.color ?? "#6C47FF",
    },
  });

  const selectedColor = form.watch("color");
  const selectedEmoji = form.watch("emoji");
  const nameValue = form.watch("name");

  async function onSubmit(data: CategoryInput) {
    setServerError(null);
    const result = editId
      ? await updateCategory(editId, data as Record<string, unknown>)
      : await createCategory(data as Record<string, unknown>);

    if (result.success) {
      toast.success(editId ? "Category updated!" : "Category created!");
      onSuccess?.();
    } else {
      setServerError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: selectedColor + "20" }}
          >
            {selectedEmoji}
          </div>
          <div>
            <p className="text-sm font-medium">{nameValue || "Category name"}</p>
            <p className="text-xs text-muted-foreground">Preview</p>
          </div>
        </div>

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="e.g. Groceries"
                  className="h-9 w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Emoji */}
        <FormField
          control={form.control}
          name="emoji"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emoji</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_SUGGESTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => field.onChange(e)}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center rounded-lg border text-lg transition-all",
                        field.value === e
                          ? "border-primary bg-primary/10 scale-110"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Color */}
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex gap-2 flex-wrap">
                  {PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      className="w-7 h-7 rounded-full transition-all"
                      style={{
                        backgroundColor: color,
                        outline: selectedColor === color ? "2px solid white" : "2px solid transparent",
                        outlineOffset: "2px",
                      }}
                      aria-label={color}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <div className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
            {serverError}
          </div>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full h-10">
          {form.formState.isSubmitting ? "Saving…" : editId ? "Update Category" : "Create Category"}
        </Button>
      </form>
    </Form>
  );
}
