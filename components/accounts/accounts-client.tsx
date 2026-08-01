"use client";

import React, { useState } from "react";
import { Plus, Wallet, AlertTriangle, Edit2, Trash2, CheckCircle2, X } from "lucide-react";
import { createAccountAction, updateAccountAction, deleteAccountAction } from "@/app/actions/finance-actions";

export function AccountsClient({ initialAccounts }: { initialAccounts: any[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<any | null>(null);
  const [deleteAcc, setDeleteAcc] = useState<any | null>(null);
  const [reassignAccId, setReassignAccId] = useState(
    initialAccounts.find((a) => a.id !== deleteAcc?.id)?.id || ""
  );

  // Form state
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("Siddharth");
  const [type, setType] = useState("bank");
  const [openingBalance, setOpeningBalance] = useState("0");

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreate = () => {
    setEditingAcc(null);
    setName("");
    setOwner("Siddharth");
    setType("bank");
    setOpeningBalance("0");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingAcc(acc);
    setName(acc.name);
    setOwner(acc.owner);
    setType(acc.type);
    setOpeningBalance(String(acc.openingBalance));
    setIsAddOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || isSaving) return;

    setIsSaving(true);
    try {
      if (editingAcc) {
        await updateAccountAction(editingAcc.id, {
          name,
          owner,
          type,
          openingBalance: parseFloat(openingBalance),
        });
      } else {
        await createAccountAction({
          name,
          owner,
          type,
          openingBalance: parseFloat(openingBalance),
        });
      }
      setIsAddOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteAcc || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteAccountAction(deleteAcc.id, reassignAccId);
      setDeleteAcc(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Bank Accounts</h1>
          <p className="text-xs text-muted-foreground">Manage cash accounts, balances, and funding sources</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialAccounts.map((acc) => (
          <div
            key={acc.id}
            className={`glass-panel p-5 rounded-3xl space-y-4 border transition-all ${
              acc.hasShortfall ? "border-destructive/40 bg-destructive/5" : "border-border/60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent text-muted-foreground">
                  {acc.type.replace("_", " ")} • {acc.owner}
                </span>
                <h3 className="font-bold text-lg text-foreground mt-1">{acc.name}</h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(acc)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setDeleteAcc(acc);
                    setReassignAccId(initialAccounts.find((a) => a.id !== acc.id)?.id || "");
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-center">
              <div>
                <div className="text-[11px] text-muted-foreground">Current</div>
                <div className="font-bold text-sm text-foreground">₹{acc.currentBalance.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Pending</div>
                <div className="font-bold text-sm text-amber-400">₹{acc.pendingExpensesAmount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Projected</div>
                <div className={`font-bold text-sm ${acc.hasShortfall ? "text-destructive" : "text-emerald-400"}`}>
                  ₹{acc.projectedBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {acc.hasShortfall && (
              <div className="p-2.5 rounded-2xl bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Shortfall detected! Account needs funding.</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-foreground">{editingAcc ? "Edit Account" : "Add Account"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Savings"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Owner</label>
                  <select
                    required
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                  >
                    <option value="Siddharth">Siddharth</option>
                    <option value="Isha">Isha</option>
                    <option value="Joint">Joint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="cash">Cash / Wallet</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-bold text-base focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete with Reassignment Modal */}
      {deleteAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-destructive">Delete Account: {deleteAcc.name}</h3>
            <p className="text-xs text-muted-foreground">
              Historical income and expenses tied to this account must be reassigned before deletion.
            </p>
            <form onSubmit={handleDelete} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Reassign Records To</label>
                <select
                  value={reassignAccId}
                  onChange={(e) => setReassignAccId(e.target.value)}
                  disabled={isDeleting}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground disabled:opacity-50"
                >
                  {initialAccounts
                    .filter((a) => a.id !== deleteAcc.id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.owner})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDeleteAcc(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-5 py-2 text-xs font-semibold bg-destructive text-white hover:bg-destructive/90 rounded-xl shadow-md disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Reassign & Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
