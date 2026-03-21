"use client";

import { useState, useTransition } from "react";
import { getTransactionFormData } from "@/actions/transactions";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
} from "@/components/ui/credenza";

type FormData = Awaited<ReturnType<typeof getTransactionFormData>>;

export function FAB() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(null);
  const [loading, startLoading] = useTransition();

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && !formData) {
      startLoading(async () => {
        const data = await getTransactionFormData();
        setFormData(data);
      });
    }
  }

  return (
    <>
      <Button
        onClick={() => handleOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-50 size-14 rounded-full shadow-lg text-2xl"
        aria-label="Add transaction"
      >
        +
      </Button>

      <Credenza open={open} onOpenChange={handleOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Add Transaction</CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody className="pb-4">
            {loading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 bg-secondary rounded-lg" />
                <div className="h-12 bg-secondary rounded-lg" />
                <div className="h-10 bg-secondary rounded-lg" />
                <div className="h-10 bg-secondary rounded-lg" />
                <div className="h-10 bg-secondary rounded-lg" />
              </div>
            )}

            {!loading && formData && (
              <TransactionForm
                wallets={formData.wallets}
                categories={formData.categories}
                onSuccess={() => setOpen(false)}
              />
            )}

            {!loading && !formData && (
              <p className="text-muted-foreground text-sm text-center py-4">
                Failed to load. Please try again.
              </p>
            )}
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
