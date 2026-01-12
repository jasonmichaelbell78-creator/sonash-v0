"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "@/lib/firebase";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Search } from "lucide-react";
import type { AdminCrudConfig, BaseEntity } from "./admin-crud-types";

interface AdminCrudTableProps<T extends BaseEntity> {
  config: AdminCrudConfig<T>;
}

export function AdminCrudTable<T extends BaseEntity>({ config }: AdminCrudTableProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Modal state
  const [modalMode, setModalMode] = useState<"closed" | "add" | "edit">("closed");
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<Partial<T>>(config.emptyFormData as Partial<T>);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Initialize filters
  useEffect(() => {
    if (config.filters) {
      const initialFilters: Record<string, string> = {};
      config.filters.forEach((f) => (initialFilters[f.key] = "all"));
      setFilters(initialFilters);
    }
  }, [config.filters]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let data: T[];

      if (config.service) {
        // Use provided service
        data = await config.service.getAll();
      } else if (config.collectionName) {
        // Direct Firestore fetch
        const ref = collection(db, config.collectionName);
        const snapshot = await getDocs(ref);
        data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
      } else {
        throw new Error("Must provide either service or collectionName");
      }

      setItems(data);
    } catch (error) {
      // CANON-0076: Log error type only - don't expose raw error objects
      logger.error(`Error fetching ${config.entityNamePlural}`, {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorCode: (error as { code?: string })?.code,
      });
    }
    setLoading(false);
  }, [config.service, config.collectionName, config.entityNamePlural]);

  // Fetch data
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filter items
  const filteredItems = items.filter((item) => {
    // Search filter
    const matchesSearch = config.searchFields.some((field) => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (!matchesSearch) return false;

    // Custom filters
    if (config.filters) {
      for (const filter of config.filters) {
        const filterValue = filters[filter.key];
        if (filterValue && filterValue !== "all") {
          const itemValue = filter.getValue
            ? filter.getValue(item)
            : String(item[filter.key as keyof T]);

          if (itemValue !== filterValue) return false;
        }
      }
    }

    return true;
  });

  // Open add modal
  const handleAdd = () => {
    setFormData(config.emptyFormData as Partial<T>);
    setEditingItem(null);
    setModalMode("add");
  };

  // Open edit modal
  const handleEdit = (item: T) => {
    setFormData(item);
    setEditingItem(item);
    setModalMode("edit");
  };

  // Save (add or update)
  const handleSave = async () => {
    // Validate
    if (config.validateForm) {
      const error = config.validateForm(formData);
      if (error) {
        alert(error);
        return;
      }
    }

    setSaving(true);
    try {
      if (config.cloudFunctions) {
        // Use Cloud Functions
        const functions = getFunctions();
        const saveFunction = httpsCallable(functions, config.cloudFunctions.saveFunctionName);

        const payload = {
          [config.entityName.toLowerCase()]: {
            ...(editingItem?.id ? { id: editingItem.id } : {}),
            ...formData,
          },
        };

        await saveFunction(payload);
      } else if (config.service) {
        // Use service
        if (editingItem) {
          await config.service.update(editingItem.id, formData);
        } else {
          await config.service.add(formData as Omit<T, "id">);
        }
      } else {
        throw new Error("Must provide either cloudFunctions or service for save");
      }

      await fetchItems();
      setModalMode("closed");
      setFormData(config.emptyFormData as Partial<T>);
      setEditingItem(null);
    } catch (error) {
      // CANON-0076: Log error type only - don't expose raw error objects
      logger.error(`Error saving ${config.entityName}`, {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorCode: (error as { code?: string })?.code,
      });
      // Generic user-facing message - don't expose internal error details
      alert(`Failed to save ${config.entityName}. Please try again.`);
    }
    setSaving(false);
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      if (config.cloudFunctions) {
        // Use Cloud Functions
        const functions = getFunctions();
        const deleteFunction = httpsCallable(functions, config.cloudFunctions.deleteFunctionName);

        await deleteFunction({ [`${config.entityName.toLowerCase()}Id`]: deleteId });
      } else if (config.service) {
        // Use service
        await config.service.delete(deleteId);
      } else {
        throw new Error("Must provide either cloudFunctions or service for delete");
      }

      await fetchItems();
      setDeleteId(null);
    } catch (error) {
      // CANON-0076: Log error type only - don't expose raw error objects
      logger.error(`Error deleting ${config.entityName}`, {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorCode: (error as { code?: string })?.code,
      });
      // Generic user-facing message - don't expose internal error details
      alert(`Failed to delete ${config.entityName}. Please try again.`);
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading {config.entityNamePlural}...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${config.entityNamePlural.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/50"
            />
          </div>

          {/* Custom filters */}
          {config.filters?.map((filter) => (
            <select
              key={filter.key}
              value={filters[filter.key] || "all"}
              onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.value })}
              className="h-9 px-3 pr-8 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/50"
            >
              <option value="all">All {filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {config.showResetButton && config.resetData && (
            <button
              onClick={async () => {
                if (
                  confirm(`Reset all ${config.entityNamePlural.toLowerCase()} to initial data?`)
                ) {
                  setLoading(true);
                  await config.resetData!();
                  await fetchItems();
                  setLoading(false);
                }
              }}
              className="bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300 px-4 py-2 rounded-lg transition-colors text-sm"
            >
              ⚠️ Reset Data
            </button>
          )}

          <Button onClick={handleAdd} size="sm" className="bg-blue-500 hover:bg-blue-600">
            <Plus className="w-4 h-4 mr-1.5" /> Add {config.entityName}
          </Button>
        </div>
      </div>

      {/* Count */}
      <div className="text-sm text-gray-500">
        Showing {filteredItems.length} of {items.length} {config.entityNamePlural.toLowerCase()}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No {config.entityNamePlural.toLowerCase()} found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {config.columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={`text-left px-4 py-3 text-sm font-medium text-gray-600 ${col.className || ""}`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  {config.columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-4 py-3 text-sm ${col.className || ""}`}
                    >
                      {col.render ? col.render(item) : String(item[col.key as keyof T] || "")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog
        open={modalMode !== "closed"}
        onOpenChange={(open) => !open && setModalMode("closed")}
      >
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "add" ? `Add ${config.entityName}` : `Edit ${config.entityName}`}
            </DialogTitle>
          </DialogHeader>

          <config.FormComponent
            formData={formData}
            setFormData={setFormData}
            isEditing={modalMode === "edit"}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalMode("closed")}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle>Delete {config.entityName}?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete this {config.entityName.toLowerCase()}? This action
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
