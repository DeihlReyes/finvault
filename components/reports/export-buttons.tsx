"use client";

import { useState } from "react";
import { triggerExport } from "@/actions/export";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = { month: number; year: number };

export function ExportButtons({ month, year }: Props) {
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  async function handleExport(format: "csv" | "pdf") {
    const setLoading = format === "csv" ? setLoadingCsv : setLoadingPdf;
    setLoading(true);
    try {
      const result = await triggerExport(format, month, year);
      if (result.success && result.data) {
        window.location.href = result.data.url;
        toast.success(`${format.toUpperCase()} export ready! +20 XP`);
      } else {
        toast.error(!result.success ? result.error : "Export failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={loadingCsv}
        onClick={() => handleExport("csv")}
      >
        {loadingCsv ? "…" : "↓ CSV"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={loadingPdf}
        onClick={() => handleExport("pdf")}
      >
        {loadingPdf ? "…" : "↓ PDF"}
      </Button>
    </div>
  );
}
