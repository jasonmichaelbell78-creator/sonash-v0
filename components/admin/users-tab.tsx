"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { logger, maskIdentifier } from "@/lib/logger";
import { useTabRefresh } from "@/lib/hooks/use-tab-refresh";
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
  ChevronDown,
  ArrowUpDown,
  Loader2,
  Shield,
  KeyRound,
  Trash2,
  Undo2,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { formatDistanceToNow } from "date-fns";

interface UserSearchResult {
  uid: string;
  email: string | null;
  nickname: string;
  disabled: boolean;
  lastActive: string | null;
  createdAt: string | null;
  isSoftDeleted?: boolean;
  scheduledHardDeleteAt?: string | null;
}

type SortField = "createdAt" | "lastActive" | "nickname";
type SortOrder = "asc" | "desc";

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
  privilegeType?: string;
  isSoftDeleted?: boolean;
  softDeletedAt?: string | null;
  softDeletedBy?: string | null;
  scheduledHardDeleteAt?: string | null;
  softDeleteReason?: string | null;
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

interface PrivilegeType {
  id: string;
  name: string;
  description: string;
  features: string[];
  isDefault?: boolean;
}

export function UsersTab() {
  // List/pagination state
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Detail drawer state
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingNotes, setEditingNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Privilege state
  const [privilegeTypes, setPrivilegeTypes] = useState<PrivilegeType[]>([]);
  const [selectedPrivilege, setSelectedPrivilege] = useState<string>("");
  const [savingPrivilege, setSavingPrivilege] = useState(false);

  // Password reset state
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const passwordResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Soft-delete state
  const [deleteDialogStep, setDeleteDialogStep] = useState<0 | 1 | 2>(0); // 0=closed, 1=confirm, 2=type DELETE
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deletingUser, setDeletingUser] = useState(false);
  const [undeletingUser, setUndeletingUser] = useState(false);

  // Cleanup password reset timeout on unmount
  useEffect(() => {
    return () => {
      if (passwordResetTimeoutRef.current) {
        clearTimeout(passwordResetTimeoutRef.current);
      }
    };
  }, []);

  // Reset password reset UI when switching users (prevents stale timeout updates)
  useEffect(() => {
    setPasswordResetSent(false);
    setSendingPasswordReset(false);

    if (passwordResetTimeoutRef.current) {
      clearTimeout(passwordResetTimeoutRef.current);
      passwordResetTimeoutRef.current = null;
    }
  }, [selectedUser?.profile.uid]);

  // Load users on mount and when sort changes
  const loadUsers = useCallback(
    async (cursor?: string | null) => {
      const isLoadingMore = !!cursor;
      if (isLoadingMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const functions = getFunctions();
        const listFn = httpsCallable<
          { limit?: number; startAfterUid?: string; sortBy?: SortField; sortOrder?: SortOrder },
          { users: UserSearchResult[]; hasMore: boolean; nextCursor: string | null }
        >(functions, "adminListUsers");

        const result = await listFn({
          limit: 20,
          startAfterUid: cursor || undefined,
          sortBy,
          sortOrder,
        });

        if (isLoadingMore) {
          setUsers((prev) => [...prev, ...result.data.users]);
        } else {
          setUsers(result.data.users);
        }
        setHasMore(result.data.hasMore);
        setNextCursor(result.data.nextCursor);
      } catch (err) {
        logger.error("Failed to load users", {
          errorType: err instanceof Error ? err.constructor.name : typeof err,
        });
        // Use generic error message to avoid exposing internal details
        setError("Failed to load users. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sortBy, sortOrder]
  );

  // Auto-refresh when tab becomes active
  useTabRefresh("users", () => loadUsers(), { skipInitial: true });

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Load privilege types on mount
  useEffect(() => {
    async function loadPrivilegeTypes() {
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
      }
    }
    loadPrivilegeTypes();
  }, []);

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (field === sortBy) {
      // Toggle order if same field
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setNextCursor(null);
    setUsers([]);
  };

  async function handleSearch() {
    if (!searchQuery.trim()) {
      // Clear search and return to list view
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setIsSearchMode(true);
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
      // SECURITY: Don't expose raw error messages to UI
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchMode(false);
    setError(null);
  }

  // Auto-clear search mode when search field is emptied
  useEffect(() => {
    if (searchQuery === "" && isSearchMode) {
      setSearchResults([]);
      setIsSearchMode(false);
      setError(null);
    }
  }, [searchQuery, isSearchMode]);

  // Determine which users to display
  const displayUsers = isSearchMode ? searchResults : users;

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
      setSelectedPrivilege(result.data.profile.privilegeType || "free");
    } catch (err) {
      logger.error("Failed to load user detail", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        userId: maskIdentifier(uid),
      });
      // SECURITY: Don't expose raw error messages to UI
      setError("Failed to load user details. Please try again.");
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
      // SECURITY: Don't expose raw error messages to UI
      setError("Failed to save notes. Please try again.");
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
      // SECURITY: Don't expose raw error messages to UI
      setError("Failed to update user status. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePrivilege() {
    if (!selectedUser || !selectedPrivilege) return;

    // Don't save if privilege hasn't changed
    if (selectedPrivilege === (selectedUser.profile.privilegeType || "free")) return;

    const confirmMessage =
      selectedPrivilege === "admin"
        ? "Are you sure you want to grant admin privileges to this user? They will have full access to the admin panel."
        : `Are you sure you want to change this user's privilege to ${selectedPrivilege}?`;

    if (!confirm(confirmMessage)) {
      setSelectedPrivilege(selectedUser.profile.privilegeType || "free");
      return;
    }

    setSavingPrivilege(true);
    setError(null);

    try {
      const functions = getFunctions();
      const setPrivilegeFn = httpsCallable<
        { uid: string; privilegeTypeId: string },
        { success: boolean; message: string }
      >(functions, "adminSetUserPrivilege");

      await setPrivilegeFn({
        uid: selectedUser.profile.uid,
        privilegeTypeId: selectedPrivilege,
      });

      // Update local state
      setSelectedUser({
        ...selectedUser,
        profile: {
          ...selectedUser.profile,
          privilegeType: selectedPrivilege,
          isAdmin: selectedPrivilege === "admin",
        },
      });
    } catch (err) {
      logger.error("Failed to update user privilege", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        userId: maskIdentifier(selectedUser.profile.uid),
      });
      // SECURITY: Don't expose raw error messages to UI
      setError("Failed to update user privilege. Please try again.");
      // Revert selection on error
      setSelectedPrivilege(selectedUser.profile.privilegeType || "free");
    } finally {
      setSavingPrivilege(false);
    }
  }

  async function handleSendPasswordReset() {
    if (!selectedUser?.profile.email) {
      setError("Cannot send password reset - user has no email address");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to send a password reset email to ${selectedUser.profile.email}?`
      )
    ) {
      return;
    }

    setSendingPasswordReset(true);
    setError(null);
    setPasswordResetSent(false);

    try {
      const functions = getFunctions();
      const resetFn = httpsCallable<{ email: string }, { success: boolean; message: string }>(
        functions,
        "adminSendPasswordReset"
      );

      await resetFn({ email: selectedUser.profile.email });
      setPasswordResetSent(true);

      // Reset the success indicator after 5 seconds
      // Clear any existing timeout first to prevent stale state updates
      if (passwordResetTimeoutRef.current) {
        clearTimeout(passwordResetTimeoutRef.current);
      }
      passwordResetTimeoutRef.current = setTimeout(() => setPasswordResetSent(false), 5000);
    } catch (err) {
      logger.error("Failed to send password reset", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        userId: maskIdentifier(selectedUser.profile.uid),
      });
      setError("Failed to send password reset email. Please try again.");
    } finally {
      setSendingPasswordReset(false);
    }
  }

  function openDeleteDialog() {
    setDeleteDialogStep(1);
    setDeleteConfirmText("");
    setDeleteReason("");
  }

  function closeDeleteDialog() {
    setDeleteDialogStep(0);
    setDeleteConfirmText("");
    setDeleteReason("");
  }

  // SAFETY: Close delete dialog if selected user changes mid-flow to prevent deleting wrong user
  useEffect(() => {
    if (deleteDialogStep > 0) {
      closeDeleteDialog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?.profile.uid]);

  // ACCESSIBILITY: Global Escape key handler for closing dialogs and drawer
  // Note: onKeyDown on divs doesn't work because divs don't receive keyboard focus
  useEffect(() => {
    if (!selectedUser && deleteDialogStep === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Delete dialog takes priority over drawer
      if (deleteDialogStep > 0) {
        closeDeleteDialog();
        return;
      }
      if (selectedUser) {
        setSelectedUser(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUser, deleteDialogStep]);

  async function handleSoftDelete() {
    if (!selectedUser || deleteConfirmText.trim() !== "DELETE") return;

    // STABILITY: Capture uid at start to prevent race conditions if selection changes
    const uid = selectedUser.profile.uid;
    const reasonToSave = deleteReason || undefined;

    setDeletingUser(true);
    setError(null);

    try {
      const functions = getFunctions();
      const softDeleteFn = httpsCallable<
        { uid: string; reason?: string },
        { success: boolean; scheduledHardDeleteAt: string }
      >(functions, "adminSoftDeleteUser");

      const result = await softDeleteFn({
        uid,
        reason: reasonToSave,
      });

      // Update local state (guard against stale selection)
      setSelectedUser((prev) => {
        if (!prev || prev.profile.uid !== uid) return prev;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            isSoftDeleted: true,
            softDeletedAt: new Date().toISOString(),
            scheduledHardDeleteAt: result.data.scheduledHardDeleteAt,
            softDeleteReason: reasonToSave || null,
            disabled: true,
          },
        };
      });

      // Update users list
      setUsers((prev) =>
        prev.map((user) =>
          user.uid === uid
            ? {
                ...user,
                isSoftDeleted: true,
                scheduledHardDeleteAt: result.data.scheduledHardDeleteAt,
                disabled: true,
              }
            : user
        )
      );
      setSearchResults((prev) =>
        prev.map((user) =>
          user.uid === uid
            ? {
                ...user,
                isSoftDeleted: true,
                scheduledHardDeleteAt: result.data.scheduledHardDeleteAt,
                disabled: true,
              }
            : user
        )
      );

      closeDeleteDialog();
    } catch (err) {
      logger.error("Failed to soft-delete user", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        userId: maskIdentifier(uid),
      });
      setError("Failed to delete user. Please try again.");
    } finally {
      setDeletingUser(false);
    }
  }

  async function handleUndelete() {
    if (!selectedUser) return;

    // STABILITY: Capture uid at start to prevent race conditions if selection changes
    const uid = selectedUser.profile.uid;

    if (!confirm("Are you sure you want to restore this user? They will be able to sign in again."))
      return;

    setUndeletingUser(true);
    setError(null);

    try {
      const functions = getFunctions();
      const undeleteFn = httpsCallable<{ uid: string }, { success: boolean }>(
        functions,
        "adminUndeleteUser"
      );

      await undeleteFn({ uid });

      // Update local state (guard against stale selection)
      setSelectedUser((prev) => {
        if (!prev || prev.profile.uid !== uid) return prev;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            isSoftDeleted: false,
            softDeletedAt: null,
            softDeletedBy: null,
            scheduledHardDeleteAt: null,
            softDeleteReason: null,
            disabled: false,
          },
        };
      });

      // Update users list
      setUsers((prev) =>
        prev.map((user) =>
          user.uid === uid
            ? {
                ...user,
                isSoftDeleted: false,
                scheduledHardDeleteAt: null,
                disabled: false,
              }
            : user
        )
      );
      setSearchResults((prev) =>
        prev.map((user) =>
          user.uid === uid
            ? {
                ...user,
                isSoftDeleted: false,
                scheduledHardDeleteAt: null,
                disabled: false,
              }
            : user
        )
      );
    } catch (err) {
      logger.error("Failed to undelete user", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        userId: maskIdentifier(uid),
      });
      setError("Failed to restore user. Please try again.");
    } finally {
      setUndeletingUser(false);
    }
  }

  // Helper to calculate days until hard delete
  // ROBUSTNESS: Validate date to prevent NaN display
  function getDaysUntilHardDelete(scheduledHardDeleteAt: string | null | undefined): number | null {
    if (!scheduledHardDeleteAt) return null;

    const hardDeleteDate = new Date(scheduledHardDeleteAt);
    if (Number.isNaN(hardDeleteDate.getTime())) return null;

    const days = differenceInDays(hardDeleteDate, new Date());
    return days > 0 ? days : 0;
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
            disabled={searching}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? "Searching..." : "Search"}
          </button>
          {isSearchMode && (
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Sort Controls (only show when not in search mode) */}
      {!isSearchMode && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-amber-700">Sort by:</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleSortChange("createdAt")}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === "createdAt"
                  ? "bg-amber-500 text-white"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Joined
              {sortBy === "createdAt" && (
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`}
                />
              )}
            </button>
            <button
              onClick={() => handleSortChange("lastActive")}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === "lastActive"
                  ? "bg-amber-500 text-white"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
              }`}
            >
              <Activity className="w-4 h-4" />
              Last Active
              {sortBy === "lastActive" && (
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`}
                />
              )}
            </button>
            <button
              onClick={() => handleSortChange("nickname")}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === "nickname"
                  ? "bg-amber-500 text-white"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              Name
              {sortBy === "nickname" && (
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`}
                />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="ml-2 text-amber-700">Loading users...</span>
        </div>
      )}

      {/* Search Mode Indicator */}
      {isSearchMode && searchResults.length > 0 && (
        <div className="text-sm text-amber-700">
          Found {searchResults.length} user(s) matching &ldquo;{searchQuery}&rdquo;
        </div>
      )}

      {/* User List */}
      {!loading && displayUsers.length > 0 && (
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
                {displayUsers.map((user) => (
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
                      <div className="flex flex-col gap-1">
                        {user.isSoftDeleted ? (
                          <>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Trash2 className="w-3 h-3 mr-1" />
                              Pending Deletion
                            </span>
                            {user.scheduledHardDeleteAt && (
                              <span className="text-xs text-orange-600">
                                {getDaysUntilHardDelete(user.scheduledHardDeleteAt)} days left
                              </span>
                            )}
                          </>
                        ) : user.disabled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination - Load More */}
          {!isSearchMode && hasMore && (
            <div className="p-4 border-t border-amber-100 flex justify-center">
              <button
                onClick={() => loadUsers(nextCursor)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Load More
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && displayUsers.length === 0 && !error && (
        <div className="bg-white rounded-lg border border-amber-100 p-12 text-center">
          <Users className="w-12 h-12 text-amber-300 mx-auto mb-4" />
          <p className="text-amber-700">
            {isSearchMode ? "No users found matching your search" : "No users found"}
          </p>
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

              {/* User Privilege */}
              <div className="bg-white border border-amber-100 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  User Privilege
                </h4>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedPrivilege}
                    onChange={(e) => setSelectedPrivilege(e.target.value)}
                    disabled={savingPrivilege || privilegeTypes.length === 0}
                    className="flex-1 border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {privilegeTypes.length === 0 ? (
                      <option>Loading privilege types…</option>
                    ) : (
                      privilegeTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} - {type.description}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    onClick={handleSavePrivilege}
                    disabled={
                      savingPrivilege ||
                      selectedPrivilege === (selectedUser.profile.privilegeType || "free")
                    }
                    className="px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {savingPrivilege ? (
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
                {selectedUser.profile.isAdmin && (
                  <p className="text-xs text-amber-600 mt-2">
                    This user has admin access to the admin panel.
                  </p>
                )}
              </div>

              {/* Soft Delete Warning Banner */}
              {selectedUser.profile.isSoftDeleted && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Trash2 className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-orange-900">Scheduled for Deletion</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        This user&apos;s account will be permanently deleted in{" "}
                        <strong>
                          {getDaysUntilHardDelete(selectedUser.profile.scheduledHardDeleteAt)} days
                        </strong>
                        . All their data (journal entries, check-ins, inventory) will be removed.
                      </p>
                      {selectedUser.profile.softDeleteReason && (
                        <p className="text-sm text-orange-600 mt-2">
                          <strong>Reason:</strong> {selectedUser.profile.softDeleteReason}
                        </p>
                      )}
                      <button
                        onClick={handleUndelete}
                        disabled={undeletingUser}
                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50"
                      >
                        {undeletingUser ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Restoring...
                          </>
                        ) : (
                          <>
                            <Undo2 className="w-4 h-4" />
                            Restore User
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              <div className="bg-white border border-amber-100 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-3">Admin Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {!selectedUser.profile.isSoftDeleted && (
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
                  )}
                  <button
                    onClick={handleSendPasswordReset}
                    disabled={sendingPasswordReset || !selectedUser.profile.email}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      passwordResetSent
                        ? "bg-green-500 text-white"
                        : "bg-amber-500 text-white hover:bg-amber-600"
                    }`}
                    title={!selectedUser.profile.email ? "User has no email address" : undefined}
                  >
                    {sendingPasswordReset ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : passwordResetSent ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Email Sent!
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        Reset Password
                      </>
                    )}
                  </button>
                  {!selectedUser.profile.isSoftDeleted && (
                    <button
                      onClick={openDeleteDialog}
                      disabled={deletingUser}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete User
                    </button>
                  )}
                </div>
                {!selectedUser.profile.email && (
                  <p className="text-xs text-amber-600 mt-2">
                    Password reset unavailable - user signed up with Google/anonymous auth
                  </p>
                )}
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

      {/* Overlay - click or Escape to close */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setSelectedUser(null)}
          onKeyDown={(e) => e.key === "Escape" && setSelectedUser(null)}
          role="presentation"
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogStep > 0 && selectedUser && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={closeDeleteDialog}
            onKeyDown={(e) => e.key === "Escape" && closeDeleteDialog()}
            role="presentation"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-dialog-title"
            >
              {deleteDialogStep === 1 ? (
                // Step 1: Initial confirmation
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 id="delete-dialog-title" className="text-lg font-semibold text-gray-900">
                        Delete User
                      </h3>
                      <p className="text-sm text-gray-500">
                        This action can be undone within 30 days
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to delete <strong>{selectedUser.profile.nickname}</strong>
                    ?
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    The user will be immediately logged out and unable to sign in. Their data will
                    be permanently deleted after 30 days unless restored.
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason (optional)
                    </label>
                    <input
                      type="text"
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="e.g., User requested account deletion"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={closeDeleteDialog}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setDeleteDialogStep(2)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Continue
                    </button>
                  </div>
                </>
              ) : (
                // Step 2: Type DELETE to confirm
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Final Confirmation</h3>
                      <p className="text-sm text-gray-500">Type DELETE to confirm</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    To confirm deletion of <strong>{selectedUser.profile.nickname}</strong>, type{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-mono">
                      DELETE
                    </code>{" "}
                    below:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="Type DELETE"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 font-mono"
                    autoFocus
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setDeleteDialogStep(1)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSoftDelete}
                      disabled={deleteConfirmText.trim() !== "DELETE" || deletingUser}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {deletingUser ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete User
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
