"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getTransactions } from "@/lib/db/queries/transactions";
import { buildCsv } from "@/lib/export/csv";
import { awardXP } from "@/lib/gamification/xp";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import { useUser } from "@/lib/hooks/use-db-queries";

type Props = { month: number; year: number };

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ month, year }: Props) {
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const { data: user } = useUser();

  async function handleCsv() {
    setLoadingCsv(true);
    try {
      const txList = await getTransactions({ month, year });
      const rows = txList.map((tx) => ({
        date: new Date(tx.date).toISOString().split("T")[0],
        type: tx.type,
        amount: Number(tx.amount),
        wallet: tx.walletName ?? "",
        category: tx.categoryName ?? "",
        note: tx.note ?? "",
      }));

      const csv = buildCsv(rows);
      const filename = `finvault-${year}-${String(month).padStart(2, "0")}.csv`;
      triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);

      awardXP(LOCAL_USER_ID, "EXPORT").catch(console.error);
      toast.success("CSV exported! +20 XP");
    } catch {
      toast.error("Export failed");
    } finally {
      setLoadingCsv(false);
    }
  }

  async function handlePdf() {
    setLoadingPdf(true);
    try {
      const txList = await getTransactions({ month, year });
      const currency = user?.currency ?? "USD";

      const rows = txList.map((tx) => ({
        date: new Date(tx.date).toISOString().split("T")[0],
        type: tx.type,
        amount: Number(tx.amount),
        wallet: tx.walletName ?? "",
        category: tx.categoryName ?? "",
        note: tx.note ?? "",
        currency,
      }));

      const totalIncome = rows
        .filter((r) => r.type === "INCOME")
        .reduce((s, r) => s + r.amount, 0);
      const totalExpenses = rows
        .filter((r) => r.type === "EXPENSE")
        .reduce((s, r) => s + r.amount, 0);

      const period = `${MONTHS[month - 1]} ${year}`;

      // Dynamic import to keep PDF renderer out of initial bundle
      const { pdf } = await import("@react-pdf/renderer");
      const { TransactionsPdfTemplate } = await import("@/lib/export/pdf-template");

      const blob = await pdf(
        TransactionsPdfTemplate({ rows, period, totalIncome, totalExpenses, currency })
      ).toBlob();

      const filename = `finvault-${year}-${String(month).padStart(2, "0")}.pdf`;
      triggerDownload(blob, filename);

      awardXP(LOCAL_USER_ID, "EXPORT").catch(console.error);
      toast.success("PDF exported! +20 XP");
    } catch {
      toast.error("Export failed");
    } finally {
      setLoadingPdf(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" disabled={loadingCsv} onClick={handleCsv}>
        {loadingCsv ? "…" : "↓ CSV"}
      </Button>
      <Button variant="outline" disabled={loadingPdf} onClick={handlePdf}>
        {loadingPdf ? "…" : "↓ PDF"}
      </Button>
    </div>
  );
}
