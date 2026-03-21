"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

type Props = {
  data: Array<{ value: number }>;
  positive: boolean;
};

export function NetWorthSparkline({ data, positive }: Props) {
  if (data.length < 2) return null;

  return (
    <div className="mt-2 -mx-1">
      <ResponsiveContainer width="100%" height={36}>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={positive ? "oklch(0.65 0.15 145)" : "hsl(var(--destructive))"}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
