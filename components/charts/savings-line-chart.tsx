"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface SavingsData {
  monthKey: string;
  savings: number;
}

export function SavingsLineChart({ data }: { data: SavingsData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
        No savings trend data available
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="monthKey" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
          <Tooltip
            formatter={(value: number) => [`₹${value.toLocaleString()}`, "Savings"]}
            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", color: "#f8fafc" }}
          />
          <Line type="monotone" dataKey="savings" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: "#22c55e" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
