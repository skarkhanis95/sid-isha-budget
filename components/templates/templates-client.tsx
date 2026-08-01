"use client";

import React, { useState } from "react";
import { Plus, Layers, Edit2, Trash2, Calendar, Tag, Wallet } from "lucide-react";
import { createTemplateAction, updateTemplateAction, deleteTemplateAction } from "@/app/actions/finance-actions";

export function TemplatesClient({
  initialTemplates,
  categories,
  accounts,
}: {
  initialTemplates: any[];
  categories: any[];
  accounts: any[];
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTmpl, setEditingTmpl] = useState<any | null>(null);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [defaultAmount, setDefaultAmount] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || "");
  const [fixed, setFixed] = useState(true);
  const [dueDay, setDueDay] = useState<string>("1");
  const [notes, setNotes] = useState("");

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingTmpl(null);
    setName("");
    setCategoryId(categories[0]?.id || "");
    setDefaultAmount("");
    setPaymentAccountId(accounts[0]?.id || "");
    setFixed(true);
    setDueDay("1");
    setNotes("");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (tmpl: any) => {
    setEditingTmpl(tmpl);
    setName(tmpl.name);
    setCategoryId(tmpl.categoryId);
    setDefaultAmount(String(tmpl.defaultAmount));
    setPaymentAccountId(tmpl.paymentAccountId);
    setFixed(Boolean(tmpl.fixed));
    setDueDay(tmpl.dueDay ? String(tmpl.dueDay) : "1");
    setNotes(tmpl.notes || "");
    setIsAddOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !defaultAmount || !categoryId || !paymentAccountId || isSaving) return;

    setIsSaving(true);
    try {
      const payload = {
        name,
        categoryId,
        defaultAmount: parseFloat(defaultAmount),
        paymentAccountId,
        fixed,
        dueDay: fixed && dueDay ? parseInt(dueDay, 10) : null,
        notes,
      };

      if (editingTmpl) {
        await updateTemplateAction(editingTmpl.id, payload);
      } else {
        await createTemplateAction(payload);
      }
      setIsAddOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEnabled = async (tmpl: any) => {
    if (togglingId === tmpl.id) return;
    setTogglingId(tmpl.id);
    try {
      await updateTemplateAction(tmpl.id, { enabled: !tmpl.enabled });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteTemplate = async (tmpl: any) => {
    if (deletingId === tmpl.id) return;
    if (confirm(`Delete template ${tmpl.name}?`)) {
      setDeletingId(tmpl.id);
      try {
        await deleteTemplateAction(tmpl.id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Expense Templates</h1>
          <p className="text-xs text-muted-foreground">Manage recurring expense templates & due-day schedules</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialTemplates.map((tmpl) => {
          const catName = categories.find((c) => c.id === tmpl.categoryId)?.name || "Category";
          const accName = accounts.find((a) => a.id === tmpl.paymentAccountId)?.name || "Account";

          return (
            <div
              key={tmpl.id}
              className={`glass-panel p-5 rounded-3xl space-y-3 border transition-all ${
                tmpl.enabled ? "border-border/60" : "border-border/20 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-foreground">{tmpl.name}</h3>
                    {tmpl.fixed && (
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                        Fixed
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span>{catName}</span>
                    <span>•</span>
                    <span>{accName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(tmpl)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(tmpl)}
                    disabled={deletingId === tmpl.id}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
                <div>
                  <div className="font-extrabold text-base text-foreground">₹{tmpl.defaultAmount.toLocaleString()}</div>
                  {tmpl.fixed && tmpl.dueDay && (
                    <div className="text-[11px] text-primary flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      Due on day {tmpl.dueDay} of every month
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggleEnabled(tmpl)}
                  disabled={togglingId === tmpl.id}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors disabled:opacity-50 ${
                    tmpl.enabled
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {togglingId === tmpl.id ? "Updating..." : tmpl.enabled ? "Active" : "Disabled"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-foreground">{editingTmpl ? "Edit Template" : "Add Template"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House Rent, Electricity Bill"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Default Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={defaultAmount}
                    onChange={(e) => setDefaultAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl font-bold text-base focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Default Paying Account</label>
                <select
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
                <div>
                  <span className="font-semibold text-xs text-foreground">Fixed Expense</span>
                  <p className="text-[11px] text-muted-foreground">Fixed expenses have relative due days</p>
                </div>
                <input
                  type="checkbox"
                  checked={fixed}
                  onChange={(e) => setFixed(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </div>

              {fixed && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Relative Due Day of Month (1–31)</label>
                  <select
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                        {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} of every month
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs focus:ring-2 focus:ring-primary focus:outline-none"
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
                  {isSaving ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
