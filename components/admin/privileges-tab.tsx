"use client";

import { useState, useEffect, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { logger } from "@/lib/logger";
import { useTabRefresh } from "@/lib/hooks/use-tab-refresh";
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  Loader2,
  AlertCircle,
  Star,
  Lock,
  Tag,
} from "lucide-react";

interface PrivilegeType {
  id: string;
  name: string;
  description: string;
  features: string[];
  isDefault?: boolean;
}

// Built-in types that cannot be deleted (but can be viewed)
const BUILT_IN_TYPES = ["admin", "free", "premium"];

// Available feature permissions that can be assigned
const AVAILABLE_FEATURES = [
  {
    id: "beta_features",
    name: "Beta Features",
    description: "Access to beta/experimental features",
  },
  { id: "early_access", name: "Early Access", description: "Early access to new features" },
  {
    id: "premium_content",
    name: "Premium Content",
    description: "Access to premium content library",
  },
  {
    id: "extended_history",
    name: "Extended History",
    description: "Extended journal history retention",
  },
  { id: "export_data", name: "Export Data", description: "Ability to export personal data" },
  { id: "custom_themes", name: "Custom Themes", description: "Access to custom notebook themes" },
  { id: "priority_support", name: "Priority Support", description: "Priority customer support" },
  { id: "offline_mode", name: "Offline Mode", description: "Full offline functionality" },
  {
    id: "advanced_analytics",
    name: "Advanced Analytics",
    description: "Detailed personal analytics",
  },
  { id: "sponsor_tools", name: "Sponsor Tools", description: "Tools for sponsors/mentors" },
];

export function PrivilegesTab() {
  const [privilegeTypes, setPrivilegeTypes] = useState<PrivilegeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit/Create state
  const [editingType, setEditingType] = useState<PrivilegeType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [formIsDefault, setFormIsDefault] = useState(false);

  // Load privilege types
  const loadPrivilegeTypes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const getPrivilegesFn = httpsCallable<void, { types: PrivilegeType[] }>(
        functions,
        "adminGetPrivilegeTypes"
      );
      const result = await getPrivilegesFn();
      setPrivilegeTypes(result.data.types);
    } catch (err) {
      logger.error("Failed to load privilege types", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
      });
      setError("Failed to load privilege types. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh when tab becomes active
  useTabRefresh("privileges", loadPrivilegeTypes, { skipInitial: true });

  useEffect(() => {
    loadPrivilegeTypes();
  }, [loadPrivilegeTypes]);

  // Reset form
  const resetForm = () => {
    setFormId("");
    setFormName("");
    setFormDescription("");
    setFormFeatures([]);
    setFormIsDefault(false);
    setEditingType(null);
    setIsCreating(false);
  };

  // Start editing
  const startEditing = (type: PrivilegeType) => {
    setEditingType(type);
    setIsCreating(false);
    setFormId(type.id);
    setFormName(type.name);
    setFormDescription(type.description);
    setFormFeatures([...type.features]);
    setFormIsDefault(type.isDefault || false);
  };

  // Start creating
  const startCreating = () => {
    resetForm();
    setIsCreating(true);
  };

  // Toggle feature
  const toggleFeature = (featureId: string) => {
    setFormFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((f) => f !== featureId) : [...prev, featureId]
    );
  };

  // Save privilege type
  const handleSave = async () => {
    if (!formId.trim() || !formName.trim()) {
      setError("ID and Name are required");
      return;
    }

    // Validate ID format (lowercase, no spaces, alphanumeric with underscores)
    const idPattern = /^[a-z][a-z0-9_]*$/;
    if (!idPattern.test(formId)) {
      setError(
        "ID must start with a letter and contain only lowercase letters, numbers, and underscores"
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const functions = getFunctions();
      const saveFn = httpsCallable<
        { privilegeType: PrivilegeType },
        { success: boolean; id: string }
      >(functions, "adminSavePrivilegeType");

      await saveFn({
        privilegeType: {
          id: formId.trim(),
          name: formName.trim(),
          description: formDescription.trim(),
          features: formFeatures,
          isDefault: formIsDefault,
        },
      });

      resetForm();
      await loadPrivilegeTypes();
    } catch (err) {
      logger.error("Failed to save privilege type", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
      });
      const errorMessage = (err as { message?: string })?.message || "";
      if (errorMessage.includes("built-in")) {
        setError("Cannot modify built-in privilege types");
      } else {
        setError("Failed to save privilege type. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete privilege type
  const handleDelete = async (typeId: string) => {
    if (BUILT_IN_TYPES.includes(typeId)) {
      setError("Cannot delete built-in privilege types");
      return;
    }

    const confirmMessage = `Are you sure you want to delete this privilege type? This cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    setDeleting(typeId);
    setError(null);

    try {
      const functions = getFunctions();
      const deleteFn = httpsCallable<{ privilegeTypeId: string }, { success: boolean }>(
        functions,
        "adminDeletePrivilegeType"
      );

      await deleteFn({ privilegeTypeId: typeId });
      await loadPrivilegeTypes();
    } catch (err) {
      logger.error("Failed to delete privilege type", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
      });
      const errorMessage = (err as { message?: string })?.message || "";
      if (errorMessage.includes("assigned to users")) {
        setError("Cannot delete privilege type while it is assigned to users");
      } else {
        setError("Failed to delete privilege type. Please try again.");
      }
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="ml-2 text-amber-700">Loading privilege types...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading text-amber-900 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Privilege Types
          </h2>
          <p className="text-sm text-amber-600 mt-1">
            Manage user privilege levels and feature access
          </p>
        </div>
        {!isCreating && !editingType && (
          <button
            onClick={startCreating}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Type
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingType) && (
        <div className="bg-white rounded-lg border border-amber-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <h3 className="font-heading text-lg text-amber-900">
              {isCreating ? "Create New Privilege Type" : `Edit: ${editingType?.name}`}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-amber-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID Field */}
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formId}
                onChange={(e) => {
                  const normalized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                  setFormId(normalized.replace(/^[^a-z]+/, ""));
                }}
                disabled={!!editingType}
                placeholder="e.g., beta_tester"
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-amber-600 mt-1">
                Lowercase letters, numbers, underscores only
              </p>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Beta Tester"
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Description</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe what this privilege level provides..."
              rows={2}
              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Default Checkbox */}
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
            <button
              type="button"
              role="checkbox"
              aria-checked={formIsDefault}
              onClick={() => setFormIsDefault(!formIsDefault)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                formIsDefault
                  ? "bg-amber-500 border-amber-500"
                  : "bg-white border-amber-300 hover:border-amber-400"
              }`}
            >
              {formIsDefault && <Check className="w-3 h-3 text-white" />}
            </button>
            <div>
              <p className="font-medium text-amber-900 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Default Privilege Type
              </p>
              <p className="text-sm text-amber-600">
                New users will automatically be assigned this privilege level
              </p>
            </div>
          </div>

          {/* Features Section */}
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Feature Permissions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {AVAILABLE_FEATURES.map((feature) => (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => toggleFeature(feature.id)}
                  className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-colors ${
                    formFeatures.includes(feature.id)
                      ? "bg-amber-100 border-amber-400"
                      : "bg-white border-amber-200 hover:bg-amber-50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      formFeatures.includes(feature.id)
                        ? "bg-amber-500 border-amber-500"
                        : "bg-white border-amber-300"
                    }`}
                  >
                    {formFeatures.includes(feature.id) && (
                      <Check className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-900">{feature.name}</p>
                    <p className="text-xs text-amber-600">{feature.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-amber-100">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formId.trim() || !formName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Privilege Types List */}
      <div className="bg-white rounded-lg border border-amber-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-50 border-b border-amber-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Features
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-amber-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {privilegeTypes.map((type) => {
                const isBuiltIn = BUILT_IN_TYPES.includes(type.id);
                const isBeingDeleted = deleting === type.id;

                return (
                  <tr
                    key={type.id}
                    className={`hover:bg-amber-50/50 transition-colors ${
                      isBeingDeleted ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Shield
                          className={`w-5 h-5 ${
                            type.id === "admin"
                              ? "text-red-500"
                              : type.id === "premium"
                                ? "text-purple-500"
                                : "text-amber-500"
                          }`}
                        />
                        <div>
                          <div className="font-medium text-amber-900 flex items-center gap-2">
                            {type.name}
                            {isBuiltIn && (
                              <span title="Built-in type">
                                <Lock className="w-3 h-3 text-amber-400" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-amber-600 font-mono">{type.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-amber-700 max-w-xs truncate">
                        {type.description || "No description"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {type.features.length > 0 ? (
                          type.features.slice(0, 3).map((f) => (
                            <span
                              key={f}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"
                            >
                              {f.replace(/_/g, " ")}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-amber-400">None</span>
                        )}
                        {type.features.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-200 text-amber-800">
                            +{type.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {type.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Star className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isBuiltIn && (
                          <>
                            <button
                              onClick={() => startEditing(type)}
                              disabled={isBeingDeleted}
                              className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(type.id)}
                              disabled={isBeingDeleted}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {isBeingDeleted ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                        {isBuiltIn && <span className="text-xs text-amber-400 px-2">Built-in</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {privilegeTypes.length === 0 && (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 text-amber-300 mx-auto mb-4" />
            <p className="text-amber-700">No privilege types found</p>
            <p className="text-sm text-amber-500 mt-1">
              Create your first privilege type to get started
            </p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4" />
          About Privilege Types
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <strong>Built-in types</strong> (admin, free, premium) cannot be modified or deleted
          </li>
          <li>
            <strong>Default type</strong> is automatically assigned to new users
          </li>
          <li>
            <strong>Features</strong> control access to specific app functionality
          </li>
          <li>
            Assign privileges to users in the <strong>Users</strong> tab
          </li>
        </ul>
      </div>
    </div>
  );
}
