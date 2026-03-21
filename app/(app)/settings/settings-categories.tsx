"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryForm } from "@/components/categories/category-form";
import { archiveCategory } from "@/actions/categories";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
} from "@/components/ui/credenza";

type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isDefault: boolean;
};

export function SettingsCategories({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [sheetMode, setSheetMode] = useState<null | "add" | { edit: Category }>(null);

  async function handleArchive(cat: Category) {
    if (!confirm(`Archive "${cat.name}"? This cannot be undone if transactions exist.`)) return;
    const result = await archiveCategory(cat.id);
    if (result.success) {
      toast.success("Category archived");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function onFormSuccess() {
    setSheetMode(null);
    router.refresh();
  }

  const editTarget = sheetMode && sheetMode !== "add" ? sheetMode.edit : null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Categories</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setSheetMode("add")}>+ Add</Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-secondary/50 group"
              >
                <div className="flex items-center gap-3 text-sm">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-base"
                    style={{ backgroundColor: cat.color + "22" }}
                  >
                    {cat.emoji}
                  </span>
                  <span>{cat.name}</span>
                  {cat.isDefault && (
                    <Badge variant="secondary" className="text-xs font-normal">default</Badge>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-xs"
                    onClick={() => setSheetMode({ edit: cat })}
                  >
                    ✎
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-xs hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleArchive(cat)}
                  >
                    🗑
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Credenza open={sheetMode !== null} onOpenChange={(open) => !open && setSheetMode(null)}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>{editTarget ? "Edit Category" : "New Category"}</CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody>
            <CategoryForm
              editId={editTarget?.id}
              initialValues={
                editTarget
                  ? { name: editTarget.name, emoji: editTarget.emoji, color: editTarget.color }
                  : undefined
              }
              onSuccess={onFormSuccess}
            />
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
