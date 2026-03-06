"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/lib/format";
import { useState, useEffect } from "react";

export interface TopHotelRow {
  name: string;
  count: number;
}

interface TopHotelsChartProps {
  data: TopHotelRow[];
}

const barColor = "rgba(0, 163, 196, 0.6)";
const gridColor = "rgba(255, 255, 255, 0.06)";
const tickColor = "#888888";

export function TopHotelsChart({ data }: TopHotelsChartProps) {
  const [yAxisWidth, setYAxisWidth] = useState(120);
  useEffect(() => {
    const update = () => setYAxisWidth(window.innerWidth < 480 ? 80 : window.innerWidth < 768 ? 100 : 120);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="h-full min-h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 12, left: 4, bottom: 12 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={true} vertical={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: tickColor, fontFamily: "var(--font-jetbrains)" }} stroke={gridColor} />
          <YAxis
            type="category"
            dataKey="name"
            width={yAxisWidth}
            tick={{ fontSize: 10, fill: tickColor, fontFamily: "var(--font-jetbrains)" }}
            stroke={gridColor}
          />
          <Tooltip
            cursor={false}
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333333",
              borderRadius: "0",
              fontSize: "11px",
              color: "#f8f6f1",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              fontFamily: "var(--font-jetbrains)",
            }}
            formatter={(value) => [formatNumber(typeof value === "number" ? value : 0), "Employees"]}
            labelFormatter={(label) => `Hotel: ${label}`}
          />
          <Bar
            dataKey="count"
            fill={barColor}
            radius={[0, 0, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
