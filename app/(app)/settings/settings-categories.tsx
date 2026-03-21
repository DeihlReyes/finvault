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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add, Edit, Trash } from "@hugeicons/core-free-icons";
import { Separator } from "@/components/ui/separator";

type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isDefault: boolean;
};

export function SettingsCategories({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [sheetMode, setSheetMode] = useState<null | "add" | { edit: Category }>(
    null,
  );
  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null);
  const [archiving, setArchiving] = useState(false);

  async function handleArchive() {
    if (!archiveTarget) return;
    setArchiving(true);
    const result = await archiveCategory(archiveTarget.id);
    setArchiving(false);
    setArchiveTarget(null);
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
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => setSheetMode("add")}
            >
              <HugeiconsIcon icon={Add} /> Add Category
            </Button>
          </div>
        </CardHeader>
        <Separator />
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
                    <Badge variant="secondary" className="text-xs font-normal">
                      default
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setSheetMode({ edit: cat })}
                  >
                    <HugeiconsIcon icon={Edit} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setArchiveTarget(cat)}
                  >
                    <HugeiconsIcon icon={Trash} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Archive &ldquo;{archiveTarget?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The category will be hidden. Existing transactions are preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={archiving}
              onClick={handleArchive}
            >
              {archiving ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Credenza
        open={sheetMode !== null}
        onOpenChange={(open) => !open && setSheetMode(null)}
      >
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>
              {editTarget ? "Edit Category" : "New Category"}
            </CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody>
            <CategoryForm
              editId={editTarget?.id}
              initialValues={
                editTarget
                  ? {
                      name: editTarget.name,
                      emoji: editTarget.emoji,
                      color: editTarget.color,
                    }
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
