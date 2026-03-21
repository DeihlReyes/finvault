type TxRow = {
  date: string;
  type: string;
  amount: number;
  wallet: string;
  category: string;
  note: string;
};

export function buildCsv(rows: TxRow[]): string {
  const header = ["Date", "Type", "Amount", "Wallet", "Category", "Note"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.date,
        r.type,
        r.amount.toFixed(2),
        csvEscape(r.wallet),
        csvEscape(r.category),
        csvEscape(r.note),
      ].join(",")
    ),
  ];
  return lines.join("\n");
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
