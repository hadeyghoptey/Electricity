"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { type MonthlyDataPoint } from "@/lib/utils";

interface UsageChartProps {
  primaryData: MonthlyDataPoint[];
  secondaryData: MonthlyDataPoint[];
}

function mergeData(
  primary: MonthlyDataPoint[],
  secondary: MonthlyDataPoint[]
): Array<{
  label: string;
  [key: string]: string | number;
}> {
  const monthSet = new Set<string>();
  for (const d of primary) monthSet.add(d.month);
  for (const d of secondary) monthSet.add(d.month);

  const allMonths = Array.from(monthSet).sort();

  const pMap = new Map(primary.map((d) => [d.month, d]));
  const sMap = new Map(secondary.map((d) => [d.month, d]));

  return allMonths.map((month) => ({
    label: pMap.get(month)?.label ?? sMap.get(month)?.label ?? month,
    "Primary House": pMap.get(month)?.totalUnits ?? 0,
    "Secondary House": sMap.get(month)?.totalUnits ?? 0,
  }));
}

export function UsageChart({ primaryData, secondaryData }: UsageChartProps) {
  const chartData = mergeData(primaryData, secondaryData);

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-5">
      <h2 className="text-base md:text-lg font-semibold text-foreground mb-4">Usage Trend</h2>
      <div className="h-72 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(v: number) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "13px",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number, name: string) => [`${value.toFixed(1)} units`, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            />
            <Line
              type="monotone"
              dataKey="Primary House"
              stroke="hsl(210 100% 55%)"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(210 100% 55%)" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="Secondary House"
              stroke="hsl(160 60% 45%)"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(160 60% 45%)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
