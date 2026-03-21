"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

type MonthData = { label: string; income: number; expenses: number };

type Props = { data: MonthData[]; currency: string };

export function IncomeExpenseBarChart({ data, currency }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-10">
        No data available
      </p>
    );
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: "compact",
    }).format(v);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value) => fmt(Number(value))}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" name="Income" fill="oklch(0.65 0.15 145)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
