"use client";

import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { logger, maskIdentifier } from "@/lib/logger";
import {
  Search,
  Users,
  Mail,
  Calendar,
  Activity,
  Edit2,
  Ban,
  CheckCircle,
  X,
  Save,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserSearchResult {
  uid: string;
  email: string | null;
  nickname: string;
  disabled: boolean;
  lastActive: string | null;
  createdAt: string | null;
}

interface UserProfile {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  disabled: boolean;
  createdAt: string;
  lastSignIn: string;
  provider: string;
  nickname: string;
  soberDate: string | null;
  lastActive: string | null;
  adminNotes: string | null;
  isAdmin: boolean;
}

interface ActivityItem {
  id: string;
  type: "journal" | "daily_log";
  date: string | null;
  dateLabel: string | null;
  entryType?: string;
  mood: string | null;
  hasCravings?: boolean;
  hasUsed?: boolean;
  cravings?: boolean;
  used?: boolean;
}

interface UserDetail {
  profile: UserProfile;
  stats: {
    totalJournalEntries: number;
    totalCheckIns: number;
    totalInventory: number;
  };
  recentActivity: ActivityItem[];
}

export function UsersTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingNotes, setEditingNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);

    try {
      const functions = getFunctions();
      const searchFn = httpsCallable<
        { query: string; limit?: number },
        { results: UserSearchResult[]; total: number }
      >(functions, "adminSearchUsers");

      const result = await searchFn({ query: searchQuery.trim(), limit: 50 });
      setSearchResults(result.data.results);

      if (result.data.results.length === 0) {
        setError("No users found matching your search");
      }
    } catch (err) {
      // CANON-0076: Log error type only - don't expose raw error objects or user queries (PII risk)
      logger.error("Admin user search failed", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        errorCode: (err as { code?: string })?.code,
      });
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function loadUserDetail(uid: string) {
    setLoadingDetail(true);
    setError(null);

    try {
      const functions = getFunctions();
      const getDetailFn = httpsCallable<{ uid: string; activityLimit?: number }, UserDetail>(
        functions,
        "adminGetUserDetail"
      );

      const result = await getDetailFn({ uid, activityLimit: 30 });
      setSelectedUser(result.data);
      setAdminNotes(result.data.profile.adminNotes || "");
      setEditingNotes(false);
    } catch (err) {
      logger.error("Failed to load user detail", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        userId: maskIdentifier(uid),
      });
      setError(err instanceof Error ? err.message : "Failed to load user detail");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleSaveNotes() {
    if (!selectedUser) return;

    setSaving(true);
    setError(null);

    try {
      const functions = getFunctions();
      const updateFn = httpsCallable<
        { uid: string; updates: { adminNotes?: string } },
        { success: boolean }
      >(functions, "adminUpdateUser");

      await updateFn({ uid: selectedUser.profile.uid, updates: { adminNotes } });

      // Update local state
      setSelectedUser({
        ...selectedUser,
        profile: { ...selectedUser.profile, adminNotes },
      });
      setEditingNotes(false);
    } catch (err) {
      logger.error("Failed to save notes", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        userId: maskIdentifier(selectedUser.profile.uid),
      });
      setError(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleDisabled() {
    if (!selectedUser) return;

    const newDisabledState = !selectedUser.profile.disabled;
    const confirmMessage = newDisabledState
      ? "Are you sure you want to disable this user? They will be immediately logged out and unable to sign in."
      : "Are you sure you want to enable this user?";

    if (!confirm(confirmMessage)) return;

    setSaving(true);
    setError(null);

    try {
      const functions = getFunctions();
      const disableFn = httpsCallable<
        { uid: string; disabled: boolean; reason?: string },
        { success: boolean }
      >(functions, "adminDisableUser");

      const reason = newDisabledState ? prompt("Reason for disabling (optional):") : undefined;

      await disableFn({
        uid: selectedUser.profile.uid,
        disabled: newDisabledState,
        reason: reason || undefined,
      });

      // Update local state
      setSelectedUser({
        ...selectedUser,
        profile: { ...selectedUser.profile, disabled: newDisabledState },
      });

      // Update search results
      setSearchResults(
        searchResults.map((user) =>
          user.uid === selectedUser.profile.uid ? { ...user, disabled: newDisabledState } : user
        )
      );
    } catch (err) {
      logger.error("Failed to toggle user status", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        userId: maskIdentifier(selectedUser.profile.uid),
        newDisabledState,
      });
      setError(err instanceof Error ? err.message : "Failed to update user status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-amber-100 p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by email, UID, or nickname..."
              className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg border border-amber-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b border-amber-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {searchResults.map((user) => (
                  <tr
                    key={user.uid}
                    onClick={() => loadUserDetail(user.uid)}
                    className="hover:bg-amber-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="font-medium text-amber-900">{user.nickname}</div>
                          <div className="text-xs text-amber-600">{user.uid.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-amber-700">
                        <Mail className="w-4 h-4" />
                        {user.email || "No email"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-amber-700">
                      {user.lastActive
                        ? formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.disabled ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Detail Drawer */}
      {selectedUser && (
        <div className="fixed inset-y-0 right-0 w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-amber-100 p-6 flex items-center justify-between">
            <h2 className="text-xl font-heading text-amber-900">User Details</h2>
            <button
              onClick={() => setSelectedUser(null)}
              className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-amber-600" />
            </button>
          </div>

          {loadingDetail ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-amber-600">Loading user details...</div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div className="bg-amber-50 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center">
                    <Users className="w-8 h-8 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading text-amber-900">
                      {selectedUser.profile.nickname}
                    </h3>
                    <p className="text-sm text-amber-600">
                      {selectedUser.profile.email || "No email"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-amber-600">UID:</span>
                    <p className="font-mono text-xs text-amber-900 break-all">
                      {selectedUser.profile.uid}
                    </p>
                  </div>
                  <div>
                    <span className="text-amber-600">Provider:</span>
                    <p className="text-amber-900">{selectedUser.profile.provider}</p>
                  </div>
                  <div>
                    <span className="text-amber-600">Created:</span>
                    <p className="text-amber-900">
                      {formatDistanceToNow(new Date(selectedUser.profile.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-amber-600">Last Sign In:</span>
                    <p className="text-amber-900">
                      {formatDistanceToNow(new Date(selectedUser.profile.lastSignIn), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {selectedUser.profile.soberDate && (
                    <div>
                      <span className="text-amber-600">Sober Date:</span>
                      <p className="text-amber-900">
                        {new Date(selectedUser.profile.soberDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-amber-600">Email Verified:</span>
                    <p className="text-amber-900">
                      {selectedUser.profile.emailVerified ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-amber-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-900">
                    {selectedUser.stats.totalJournalEntries}
                  </div>
                  <div className="text-xs text-amber-600">Journal Entries</div>
                </div>
                <div className="bg-white border border-amber-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-900">
                    {selectedUser.stats.totalCheckIns}
                  </div>
                  <div className="text-xs text-amber-600">Check-Ins</div>
                </div>
                <div className="bg-white border border-amber-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-900">
                    {selectedUser.stats.totalInventory}
                  </div>
                  <div className="text-xs text-amber-600">Inventory</div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="bg-white border border-amber-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-amber-900">Admin Notes</h4>
                  {!editingNotes ? (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="p-1 hover:bg-amber-50 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-amber-600" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNotes}
                        disabled={saving}
                        className="px-3 py-1 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingNotes(false);
                          setAdminNotes(selectedUser.profile.adminNotes || "");
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {editingNotes ? (
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full border border-amber-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Add admin notes..."
                  />
                ) : (
                  <p className="text-sm text-amber-700 whitespace-pre-wrap">
                    {selectedUser.profile.adminNotes || "No notes"}
                  </p>
                )}
              </div>

              {/* Admin Actions */}
              <div className="bg-white border border-amber-100 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-3">Admin Actions</h4>
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleDisabled}
                    disabled={saving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      selectedUser.profile.disabled
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    {selectedUser.profile.disabled ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Enable User
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" />
                        Disable User
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-amber-100 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedUser.recentActivity.length === 0 ? (
                    <p className="text-sm text-amber-600">No recent activity</p>
                  ) : (
                    selectedUser.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-lg"
                      >
                        <Calendar className="w-4 h-4 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-amber-900">
                              {activity.type === "journal" ? "Journal Entry" : "Daily Check-In"}
                            </span>
                            {activity.mood && (
                              <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full">
                                {activity.mood}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-amber-600">
                            {activity.dateLabel} •{" "}
                            {activity.date
                              ? formatDistanceToNow(new Date(activity.date), { addSuffix: true })
                              : "Unknown date"}
                          </p>
                          {(activity.hasCravings ||
                            activity.cravings ||
                            activity.hasUsed ||
                            activity.used) && (
                            <div className="flex gap-2 mt-1">
                              {(activity.hasCravings || activity.cravings) && (
                                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                                  Cravings
                                </span>
                              )}
                              {(activity.hasUsed || activity.used) && (
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                                  Used
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedUser(null)} />
      )}
    </div>
  );
}
