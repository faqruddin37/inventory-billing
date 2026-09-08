"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Plus, Archive, Layers, Check } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  description?: string;
  status: "active" | "archived";
}

interface CategoryManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged: () => void;
}

export function CategoryManagerDialog({
  isOpen,
  onClose,
  onCategoriesChanged,
}: CategoryManagerDialogProps) {
  const { success, error: showError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories?status=all");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch {
      showError("Failed to load categories", "Error");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, fetchCategories]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.message || "Failed to create category", "Error");
        return;
      }

      success(`Category "${newCategoryName}" created`, "Success");
      setNewCategoryName("");
      setNewCategoryDesc("");
      fetchCategories();
      onCategoriesChanged();
    } catch {
      showError("Connection error while creating category", "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveCategory = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.message || "Failed to archive category", "Error");
        return;
      }

      success(`Category "${name}" archived`, "Archived");
      fetchCategories();
      onCategoriesChanged();
    } catch {
      showError("Connection error while archiving category", "Error");
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Product Categories"
      description="Organize spare parts into categories for fast filtering during billing and inventory management."
      className="max-w-xl max-h-[85vh] overflow-y-auto"
    >
      <div className="space-y-6 pt-2">
        {/* Create Category Form */}
        <form
          onSubmit={handleCreateCategory}
          className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 space-y-3"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 font-heading">
            <Plus className="w-3.5 h-3.5" /> Add New Category
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="e.g. Brakes & Rotors"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
            />
            <Input
              placeholder="Description (Optional)"
              value={newCategoryDesc}
              onChange={(e) => setNewCategoryDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" isLoading={isSubmitting}>
              <Check className="w-3.5 h-3.5 mr-1" /> Add Category
            </Button>
          </div>
        </form>

        {/* Existing Categories List */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold font-heading text-slate-700 uppercase tracking-wider">
            Available Categories ({categories.length})
          </h4>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
              No categories configured yet. Add your first category above.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
              {categories.map((c) => (
                <div key={c._id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block">{c.name}</span>
                      {c.description && (
                        <span className="text-slate-500 text-[11px] block">{c.description}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === "active" ? "primary" : "secondary"}>
                      {c.status}
                    </Badge>
                    {c.status === "active" && (
                      <button
                        onClick={() => handleArchiveCategory(c._id, c.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Archive Category"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
