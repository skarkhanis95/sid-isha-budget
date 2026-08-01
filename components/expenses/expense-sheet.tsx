"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Wallet, Tag, Check, Trash2 } from "lucide-react";
import { updateExpenseAction, addExpenseAction, deleteExpenseAction } from "@/app/actions/finance-actions";

interface ExpenseSheetProps {
  expense: any | null;
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  accounts: any[];
  monthId: string;
}

export function ExpenseSheet({
  expense,
  isOpen,
  onClose,
  categories,
  accounts,
  monthId,
}: ExpenseSheetProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [fixed, setFixed] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"pending" | "paid" | "skipped">("pending");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setName(expense.name || "");
      setAmount(String(expense.amount || ""));
      setCategoryId(expense.categoryId || (categories[0]?.id || ""));
      setPaymentAccountId(expense.paymentAccountId || (accounts[0]?.id || ""));
      setFixed(Boolean(expense.fixed));
      setDueDate(expense.dueDate || new Date().toISOString().split("T")[0]);
      setStatus(expense.status || "pending");
      setNotes(expense.notes || "");
    } else {
      setName("");
      setAmount("");
      setCategoryId(categories[0]?.id || "");
      setPaymentAccountId(accounts[0]?.id || "");
      setFixed(false);
      setDueDate(new Date().toISOString().split("T")[0]);
      setStatus("pending");
      setNotes("");
    }
  }, [expense, categories, accounts, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !categoryId || !paymentAccountId || !dueDate) return;

    setIsSaving(true);
    const numericAmount = parseFloat(amount);

    if (expense) {
      await updateExpenseAction(expense.id, {
        name,
        amount: numericAmount,
        categoryId,
        paymentAccountId,
        fixed,
        dueDate,
        status,
        notes,
      });
    } else {
      await addExpenseAction({
        monthId,
        name,
        amount: numericAmount,
        categoryId,
        paymentAccountId,
        fixed,
        dueDate,
        notes,
      });
    }

    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (expense && confirm(`Delete "${expense.name}"?`)) {
      setIsSaving(true);
      await deleteExpenseAction(expense.id);
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-card border border-border rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="font-bold text-lg text-foreground">
            {expense ? "Edit Expense" : "Add New Expense"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Expense Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rent, Grocery Shopping"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl font-bold text-base focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Paid From Account</label>
              <select
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
            <div>
              <span className="font-semibold text-xs text-foreground">Fixed Recurring Expense</span>
              <p className="text-[11px] text-muted-foreground">Fixed expenses participate in due-date alerts</p>
            </div>
            <input
              type="checkbox"
              checked={fixed}
              onChange={(e) => setFixed(e.target.checked)}
              className="w-5 h-5 accent-primary rounded cursor-pointer"
            />
          </div>

          {expense && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(["pending", "paid", "skipped"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                      status === s
                        ? s === "paid"
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : s === "skipped"
                          ? "bg-zinc-600 text-white border-zinc-600"
                          : "bg-amber-500 text-white border-amber-500"
                        : "bg-background text-muted-foreground border-border hover:border-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              className="w-full px-3.5 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border gap-3">
            {expense ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs text-destructive hover:bg-destructive/10 border border-destructive/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isSaving ? "Deleting..." : "Delete"}
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Expense"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
