"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteAccount } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
  CredenzaFooter,
} from "@/components/ui/credenza";

const CONFIRM_PHRASE = "delete my account";

export function DangerZone() {
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setPhrase("");
    setOpen(true);
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccount();
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete account");
        setOpen(false);
      }
      // On success the action redirects to /login — no UI update needed
    });
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <a
          href="/api/export/data"
          download
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Download all my data
        </a>
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleOpen}
        >
          Delete account
        </Button>
      </div>

      <Credenza open={open} onOpenChange={setOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Delete account</CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will permanently delete all your transactions, wallets,
              budgets, and account data. <strong>This cannot be undone.</strong>
            </p>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Type{" "}
                <span className="font-mono font-semibold text-foreground">
                  {CONFIRM_PHRASE}
                </span>{" "}
                to confirm
              </p>
              <Input
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                autoComplete="off"
              />
            </div>
          </CredenzaBody>
          <CredenzaFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={phrase !== CONFIRM_PHRASE || isPending}
              onClick={handleDelete}
            >
              {isPending ? "Deleting…" : "Delete permanently"}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
