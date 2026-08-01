"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface CategoryData {
  name: string;
  amount: number;
  color: string;
}

export function CategoryPieChart({ data }: { data: CategoryData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
        No category spending data available
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="amount"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || "#3b82f6"} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`₹${value.toLocaleString()}`, "Amount"]}
            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", color: "#f8fafc" }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ fontSize: "11px", paddingTop: "10px", color: "hsl(var(--muted-foreground))" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
