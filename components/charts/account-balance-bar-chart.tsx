"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AccountData {
  accountName: string;
  currentBalance: number;
}

export function AccountBalanceBarChart({ data }: { data: AccountData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
        No account balance data available
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
          <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
          <YAxis type="category" dataKey="accountName" stroke="#94a3b8" fontSize={11} tickLine={false} width={90} />
          <Tooltip
            formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Balance"]}
            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", color: "#f8fafc" }}
          />
          <Bar dataKey="currentBalance" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.currentBalance < 0 ? "#ef4444" : "#3b82f6"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
