import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { buildCsv } from "@/lib/export/csv";

export async function GET(req: NextRequest) {
  const auth = await getUser();
  if (!auth) return new NextResponse("Unauthorized", { status: 401 });

  const { supabaseId: userId } = auth;
  const { searchParams } = req.nextUrl;

  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : null;

  const now = new Date();
  const fromDate = month && year
    ? new Date(year, month - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const toDate = month && year
    ? new Date(year, month, 1)
    : new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const transactions = await db.transaction.findMany({
    where: { userId, date: { gte: fromDate, lt: toDate } },
    orderBy: { date: "desc" },
    include: { category: true, wallet: true },
  });

  const rows = transactions.map((tx) => ({
    date: tx.date.toISOString().split("T")[0],
    type: tx.type,
    amount: Number(tx.amount),
    wallet: tx.wallet.name,
    category: tx.category?.name ?? "",
    note: tx.note ?? "",
  }));

  const csv = buildCsv(rows);
  const filename = `finvault-${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
