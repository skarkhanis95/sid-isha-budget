"use client";

import React, { useState } from "react";
import { Plus, Tag, Edit2, Trash2, Check } from "lucide-react";
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "@/app/actions/finance-actions";

export function CategoriesClient({ initialCategories }: { initialCategories: any[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [deleteCat, setDeleteCat] = useState<any | null>(null);
  const [reassignCatId, setReassignCatId] = useState(
    initialCategories.find((c) => c.id !== deleteCat?.id)?.id || ""
  );

  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [icon, setIcon] = useState("Tag");

  const handleOpenCreate = () => {
    setEditingCat(null);
    setName("");
    setColor("#3b82f6");
    setIcon("Tag");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCat(cat);
    setName(cat.name);
    setColor(cat.color || "#3b82f6");
    setIcon(cat.icon || "Tag");
    setIsAddOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingCat) {
      await updateCategoryAction(editingCat.id, { name, color, icon });
    } else {
      await createCategoryAction({ name, color, icon });
    }
    setIsAddOpen(false);
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteCat) return;
    await deleteCategoryAction(deleteCat.id, reassignCatId);
    setDeleteCat(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Expense Categories</h1>
          <p className="text-xs text-muted-foreground">Configure categories for expense classification</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {initialCategories.map((cat) => (
          <div
            key={cat.id}
            className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
                style={{ backgroundColor: cat.color || "#3b82f6" }}
              >
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">{cat.name}</h4>
                <p className="text-[11px] text-muted-foreground">{cat.active ? "Active" : "Disabled"}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setDeleteCat(cat);
                  setReassignCatId(initialCategories.find((c) => c.id !== cat.id)?.id || "");
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-foreground">{editingCat ? "Edit Category" : "Add Category"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Housing, Utilities"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Theme Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-10 rounded-xl cursor-pointer bg-background border border-border p-1"
                  />
                  <span className="text-xs font-mono text-muted-foreground">{color}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-destructive">Delete Category: {deleteCat.name}</h3>
            <p className="text-xs text-muted-foreground">
              Existing expenses in this category must be reassigned before deletion.
            </p>
            <form onSubmit={handleDelete} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Reassign Expenses To</label>
                <select
                  value={reassignCatId}
                  onChange={(e) => setReassignCatId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                >
                  {initialCategories
                    .filter((c) => c.id !== deleteCat.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDeleteCat(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-destructive text-white hover:bg-destructive/90 rounded-xl shadow-md"
                >
                  Reassign & Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
