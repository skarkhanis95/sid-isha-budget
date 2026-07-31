"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, Ban, Edit2, Trash2, Search, ArrowUpDown } from "lucide-react";
import { markExpenseStatusAction, deleteExpenseAction } from "@/app/actions/finance-actions";

interface ExpenseTableProps {
  expenses: any[];
  onEdit: (expense: any) => void;
}

export function ExpenseTable({ expenses, onEdit }: ExpenseTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("dueDate");
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = expenses
    .filter((exp) => {
      const matchesSearch =
        exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.categoryName && exp.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" ? true : exp.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search expenses or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      {/* Desktop Sticky Header Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/60">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border sticky top-0 backdrop-blur-md">
            <tr>
              <th className="py-3.5 px-4 cursor-pointer" onClick={() => toggleSort("name")}>
                <div className="flex items-center gap-1">
                  Expense Name <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4 cursor-pointer" onClick={() => toggleSort("amount")}>
                <div className="flex items-center gap-1">
                  Amount <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer" onClick={() => toggleSort("dueDate")}>
                <div className="flex items-center gap-1">
                  Due Date <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Account</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No matching expenses found.
                </td>
              </tr>
            ) : (
              filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{exp.name}</span>
                      {exp.fixed && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                          Fixed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{exp.categoryName || "Unassigned"}</td>
                  <td className="py-3 px-4 font-bold text-foreground">₹{exp.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-muted-foreground">{exp.dueDate}</td>
                  <td className="py-3 px-4 text-muted-foreground">{exp.accountName || "Account"}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={async () => {
                        const newStatus = exp.status === "paid" ? "pending" : "paid";
                        await markExpenseStatusAction(exp.id, newStatus);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                        exp.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : exp.status === "skipped"
                          ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                      }`}
                    >
                      {exp.status === "paid" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </>
                      ) : exp.status === "skipped" ? (
                        <>
                          <Ban className="w-3 h-3" /> Skipped
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> Pending
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(exp)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                        aria-label="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete ${exp.name}?`)) {
                            await deleteExpenseAction(exp.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
