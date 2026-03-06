"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatNumber } from "@/lib/format";

export interface CategoryChartRow {
  name: string;
  value: number;
  cities: { city: string; count: number }[];
}

interface CategoryDonutChartProps {
  data: CategoryChartRow[];
}

const COLORS = ["rgba(0, 163, 196, 0.65)", "rgba(255, 255, 255, 0.2)"];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CategoryChartRow }[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  const row = payload[0].payload;

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid #333333",
        padding: "12px 16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        fontFamily: "var(--font-jetbrains)",
        fontSize: "11px",
        color: "#f8f6f1",
        minWidth: "160px",
      }}
    >
      <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", gap: "16px" }}>
        <span style={{ color: "#888888" }}>{row.name}</span>
        <span style={{ fontWeight: 700 }}>{formatNumber(row.value)}</span>
      </div>

      {row.cities.length > 0 && (
        <div style={{ borderTop: "1px solid #333333", paddingTop: "8px" }}>
          <div style={{ color: "#888888", marginBottom: "6px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
            Top cities
          </div>
          {row.cities.map((c) => (
            <div
              key={c.city}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                padding: "2px 0",
              }}
            >
              <span style={{ color: "rgba(248,246,241,0.9)" }}>{c.city}</span>
              <span style={{ color: "#00a3c4" }}>{formatNumber(c.count)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  return (
    <div className="h-full min-h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => value}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", color: "#888888", fontFamily: "var(--font-jetbrains)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
