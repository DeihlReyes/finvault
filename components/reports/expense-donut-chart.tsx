"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Entry = { name: string; value: number; emoji: string; color: string };

type Props = { data: Entry[]; currency: string };

const FALLBACK_COLORS = [
  "#6C47FF", "#F97316", "#06B6D4", "#84CC16", "#EC4899",
  "#F59E0B", "#10B981", "#8B5CF6",
];

export function ExpenseDonutChart({ data, currency }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-10">
        No expense data for this period
      </p>
    );
  }

  const chartData = data.map((d, i) => ({
    ...d,
    fill: d.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) =>
            new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(value))
          }
        />
        <Legend
          formatter={(value, entry: any) => `${entry.payload.emoji} ${value}`}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
