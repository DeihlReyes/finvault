"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resetDatabase, getDb } from "@/lib/db";
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

const CONFIRM_PHRASE = "delete my data";

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
      try {
        await resetDatabase();
        // resetDatabase does window.location.replace — execution stops here
      } catch {
        toast.error("Failed to clear data. Please try again.");
        setOpen(false);
      }
    });
  }

  async function handleExportJson() {
    try {
      const db = getDb();
      const {
        users,
        wallets,
        categories,
        transactions,
        budgets,
        achievements,
        monthlyChallenges,
        xpLogs,
        netWorthSnapshots,
      } = await import("@/lib/db/schema");

      const [u, w, cat, tx, b, ach, mc, xl, nw] = await Promise.all([
        db.select().from(users),
        db.select().from(wallets),
        db.select().from(categories),
        db.select().from(transactions),
        db.select().from(budgets),
        db.select().from(achievements),
        db.select().from(monthlyChallenges),
        db.select().from(xpLogs),
        db.select().from(netWorthSnapshots),
      ]);

      const payload = {
        exportedAt: new Date().toISOString(),
        users: u,
        wallets: w,
        categories: cat,
        transactions: tx,
        budgets: b,
        achievements: ach,
        monthlyChallenges: mc,
        xpLogs: xl,
        netWorthSnapshots: nw,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finvault-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported");
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <Button variant="outline" onClick={handleExportJson}>
          Download all my data
        </Button>

        <Button variant="destructive" onClick={handleOpen}>
          Clear all data
        </Button>
      </div>

      <Credenza open={open} onOpenChange={setOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Clear all data</CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will permanently wipe your entire local database — all
              transactions, wallets, budgets, categories, and progress.{" "}
              <strong>This cannot be undone.</strong>
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
              {isPending ? "Wiping…" : "Wipe permanently"}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
