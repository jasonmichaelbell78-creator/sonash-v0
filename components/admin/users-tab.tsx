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

// ============================================================================
// Helper Functions (extracted for cognitive complexity reduction)
// ============================================================================

/**
 * Update a user in an array of search results
 */
function updateUserInList(
  users: UserSearchResult[],
  uid: string,
  updates: Partial<UserSearchResult>
): UserSearchResult[] {
  return users.map((user) => (user.uid === uid ? { ...user, ...updates } : user));
}

/**
 * Calculate days until hard delete
 */
function getDaysUntilHardDelete(scheduledHardDeleteAt: string | null | undefined): number | null {
  if (!scheduledHardDeleteAt) return null;
  const hardDeleteDate = new Date(scheduledHardDeleteAt);
  if (Number.isNaN(hardDeleteDate.getTime())) return null;
  const days = differenceInDays(hardDeleteDate, new Date());
  return days > 0 ? days : 0;
}

// ============================================================================
// API Call Functions (extracted to reduce component complexity)
// ============================================================================

type UserListResult = {
  users: UserSearchResult[];
  hasMore: boolean;
  nextCursor: string | null;
};

type UserSearchApiResult = {
  results: UserSearchResult[];
  total: number;
};

/**
 * Fetch users list from API
 */
async function fetchUsersList(params: {
  cursor?: string | null;
  sortBy: SortField;
  sortOrder: SortOrder;
}): Promise<UserListResult> {
  const functions = getFunctions();
  const listFn = httpsCallable<
    { limit?: number; startAfterUid?: string; sortBy?: SortField; sortOrder?: SortOrder },
    UserListResult
  >(functions, "adminListUsers");

  const result = await listFn({
    limit: 20,
    startAfterUid: params.cursor || undefined,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });
  return result.data;
}

/**
 * Search users via API
 */
async function searchUsersApi(query: string): Promise<UserSearchApiResult> {
  const functions = getFunctions();
  const searchFn = httpsCallable<{ query: string; limit?: number }, UserSearchApiResult>(
    functions,
    "adminSearchUsers"
  );
  const result = await searchFn({ query, limit: 50 });
  return result.data;
}

/**
 * Fetch user detail from API
 */
async function fetchUserDetailApi(uid: string): Promise<UserDetail> {
  const functions = getFunctions();
  const getDetailFn = httpsCallable<{ uid: string; activityLimit?: number }, UserDetail>(
    functions,
    "adminGetUserDetail"
  );
  const result = await getDetailFn({ uid, activityLimit: 30 });
  return result.data;
}

/**
 * Update user admin notes via API
 */
async function updateAdminNotesApi(uid: string, adminNotes: string): Promise<void> {
  const functions = getFunctions();
  const updateFn = httpsCallable<
    { uid: string; updates: { adminNotes?: string } },
    { success: boolean }
  >(functions, "adminUpdateUser");
  await updateFn({ uid, updates: { adminNotes } });
}

/**
 * Toggle user disabled status via API
 */
async function toggleUserDisabledApi(
  uid: string,
  disabled: boolean,
  reason?: string
): Promise<void> {
  const functions = getFunctions();
  const disableFn = httpsCallable<
    { uid: string; disabled: boolean; reason?: string },
    { success: boolean }
  >(functions, "adminDisableUser");
  await disableFn({ uid, disabled, reason: reason || undefined });
}

/**
 * Set user privilege via API
 */
async function setUserPrivilegeApi(uid: string, privilegeTypeId: string): Promise<void> {
  const functions = getFunctions();
  const setPrivilegeFn = httpsCallable<
    { uid: string; privilegeTypeId: string },
    { success: boolean; message: string }
  >(functions, "adminSetUserPrivilege");
  await setPrivilegeFn({ uid, privilegeTypeId });
}

/**
 * Send password reset email via API
 */
async function sendPasswordResetApi(email: string): Promise<void> {
  const functions = getFunctions();
  const resetFn = httpsCallable<{ email: string }, { success: boolean; message: string }>(
    functions,
    "adminSendPasswordReset"
  );
  await resetFn({ email });
}

/**
 * Soft delete user via API
 */
async function softDeleteUserApi(
  uid: string,
  reason?: string
): Promise<{ scheduledHardDeleteAt: string }> {
  const functions = getFunctions();
  const softDeleteFn = httpsCallable<
    { uid: string; reason?: string },
    { success: boolean; scheduledHardDeleteAt: string }
  >(functions, "adminSoftDeleteUser");
  const result = await softDeleteFn({ uid, reason });
  return result.data;
}

/**
 * Undelete user via API
 */
async function undeleteUserApi(uid: string): Promise<void> {
  const functions = getFunctions();
  const undeleteFn = httpsCallable<{ uid: string }, { success: boolean }>(
    functions,
    "adminUndeleteUser"
  );
  await undeleteFn({ uid });
}

/**
 * Fetch privilege types via API
 */
async function fetchPrivilegeTypesApi(): Promise<PrivilegeType[]> {
  const functions = getFunctions();
  const getPrivilegesFn = httpsCallable<void, { types: PrivilegeType[] }>(
    functions,
    "adminGetPrivilegeTypes"
  );
  const result = await getPrivilegesFn();
  return result.data.types;
}

// ============================================================================
// Custom Hook for Password Reset Timeout Management
// ============================================================================

/**
 * Manages password reset timeout cleanup
 * Resets state when selected user changes to prevent stale UI state
 */
function usePasswordResetTimeout(selectedUid: string | undefined) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Reset when user changes - this is intentional derived state reset
  // The pattern is safe because it only resets UI state, preventing stale display
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional reset when user changes
    setSent(false);
    setSending(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [selectedUid]);

  const setSuccessWithTimeout = useCallback(() => {
    setSent(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSent(false), 5000);
  }, []);

  return { sending, setSending, sent, setSuccessWithTimeout };
}

/**
 * Manages escape key and dialog close effects
 */
function useEscapeKeyHandler(
  selectedUid: string | undefined,
  deleteDialogStep: number,
  closeDeleteDialog: () => void,
  setSelectedUser: (u: UserDetail | null) => void
) {
  useEffect(() => {
    if (!selectedUid && deleteDialogStep === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deleteDialogStep > 0) {
        closeDeleteDialog();
        return;
      }
      setSelectedUser(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUid, deleteDialogStep, closeDeleteDialog, setSelectedUser]);
}

/**
 * Auto-close delete dialog when user changes
 */
function useDeleteDialogSafety(
  selectedUid: string | undefined,
  deleteDialogStep: number,
  closeDeleteDialog: () => void
) {
  useEffect(() => {
    if (deleteDialogStep > 0) closeDeleteDialog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUid]);
}

/**
 * Auto-clear search mode when query is emptied
 */
function useSearchModeClear(
  searchQuery: string,
  isSearchMode: boolean,
  setSearchResults: (r: UserSearchResult[]) => void,
  setIsSearchMode: (m: boolean) => void,
  setError: (e: string | null) => void
) {
  useEffect(() => {
    if (searchQuery === "" && isSearchMode) {
      setSearchResults([]);
      setIsSearchMode(false);
      setError(null);
    }
  }, [searchQuery, isSearchMode, setSearchResults, setIsSearchMode, setError]);
}

/**
 * Get sort button classes based on active state
 */
function getSortButtonClasses(isActive: boolean): string {
  return isActive ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-800 hover:bg-amber-200";
}

/**
 * Get confirmation message for toggling user disabled state
 */
function getToggleDisabledMessage(newDisabled: boolean): string {
  return newDisabled
    ? "Are you sure you want to disable this user? They will be immediately logged out and unable to sign in."
    : "Are you sure you want to enable this user?";
}

/**
 * Get confirmation message for privilege change
 */
function getPrivilegeChangeMessage(selectedPrivilege: string): string {
  return selectedPrivilege === "admin"
    ? "Are you sure you want to grant admin privileges to this user? They will have full access to the admin panel."
    : `Are you sure you want to change this user's privilege to ${selectedPrivilege}?`;
}

/**
 * Get status badge based on user state
 */
function getUserStatusInfo(user: UserSearchResult): {
  label: string;
  className: string;
  icon?: string;
} {
  if (user.isSoftDeleted) {
    return {
      label: "Pending Deletion",
      className: "bg-orange-100 text-orange-800",
      icon: "trash",
    };
  }
  if (user.disabled) {
    return {
      label: "Disabled",
      className: "bg-red-100 text-red-800",
    };
  }
  return {
    label: "Active",
    className: "bg-green-100 text-green-800",
  };
}

// ============================================================================
// Subcomponents (extracted for cognitive complexity reduction)
// ============================================================================

/**
 * Sort button for users list
 */
function SortButton({
  field,
  currentField,
  currentOrder,
  icon: Icon,
  label,
  onClick,
}: Readonly<{
  field: SortField;
  currentField: SortField;
  currentOrder: SortOrder;
  icon: typeof Calendar;
  label: string;
  onClick: () => void;
}>) {
  const isActive = field === currentField;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${getSortButtonClasses(isActive)}`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {isActive && (
        <ChevronDown
          className={`w-3 h-3 transition-transform ${currentOrder === "asc" ? "rotate-180" : ""}`}
        />
      )}
    </button>
  );
}

/**
 * User status badge component
 */
function UserStatusBadge({
  user,
  getDaysUntilHardDelete,
}: Readonly<{
  user: UserSearchResult;
  getDaysUntilHardDelete: (date: string | null | undefined) => number | null;
}>) {
  const status = getUserStatusInfo(user);

  if (user.isSoftDeleted) {
    const daysLeft = getDaysUntilHardDelete(user.scheduledHardDeleteAt);
    return (
      <div className="flex flex-col gap-1">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
        >
          <Trash2 className="w-3 h-3 mr-1" />
          {status.label}
        </span>
        {daysLeft !== null && <span className="text-xs text-orange-600">{daysLeft} days left</span>}
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
    >
      {status.label}
    </span>
  );
}

/**
 * Search bar section
 */
function SearchBarSection({
  searchQuery,
  setSearchQuery,
  onSearch,
  searching,
  isSearchMode,
  onClear,
  error,
}: Readonly<{
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSearch: () => void;
  searching: boolean;
  isSearchMode: boolean;
  onClear: () => void;
  error: string | null;
}>) {
  return (
    <div className="bg-white rounded-lg border border-amber-100 p-6">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Search by email, UID, or nickname..."
            className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <button
          onClick={onSearch}
          disabled={searching}
          className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {searching ? "Searching..." : "Search"}
        </button>
        {isSearchMode && (
          <button
            onClick={onClear}
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
  );
}

/**
 * Sort controls section
 */
function SortControlsSection({
  sortBy,
  sortOrder,
  onSortChange,
}: Readonly<{
  sortBy: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField) => void;
}>) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-amber-700">Sort by:</span>
      <div className="flex gap-2">
        <SortButton
          field="createdAt"
          currentField={sortBy}
          currentOrder={sortOrder}
          icon={Calendar}
          label="Joined"
          onClick={() => onSortChange("createdAt")}
        />
        <SortButton
          field="lastActive"
          currentField={sortBy}
          currentOrder={sortOrder}
          icon={Activity}
          label="Last Active"
          onClick={() => onSortChange("lastActive")}
        />
        <SortButton
          field="nickname"
          currentField={sortBy}
          currentOrder={sortOrder}
          icon={ArrowUpDown}
          label="Name"
          onClick={() => onSortChange("nickname")}
        />
      </div>
    </div>
  );
}

/**
 * Users loading state
 */
function UsersLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      <span className="ml-2 text-amber-700">Loading users...</span>
    </div>
  );
}

/**
 * Users empty state
 */
function UsersEmptyState({ isSearchMode }: Readonly<{ isSearchMode: boolean }>) {
  return (
    <div className="bg-white rounded-lg border border-amber-100 p-12 text-center">
      <Users className="w-12 h-12 text-amber-300 mx-auto mb-4" />
      <p className="text-amber-700">
        {isSearchMode ? "No users found matching your search" : "No users found"}
      </p>
    </div>
  );
}

/**
 * Users list view - handles loading, search results, table, and empty state
 */
function UsersListView({
  loading,
  isSearchMode,
  searchResults,
  searchQuery,
  displayUsers,
  error,
  hasMore,
  loadingMore,
  onUserClick,
  onLoadMore,
  getDaysUntilHardDelete,
}: Readonly<{
  loading: boolean;
  isSearchMode: boolean;
  searchResults: UserSearchResult[];
  searchQuery: string;
  displayUsers: UserSearchResult[];
  error: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  onUserClick: (uid: string) => void;
  onLoadMore: () => void;
  getDaysUntilHardDelete: (date: string | null | undefined) => number | null;
}>) {
  if (loading) return <UsersLoading />;

  if (isSearchMode && searchResults.length > 0) {
    return (
      <>
        <SearchResultIndicator count={searchResults.length} query={searchQuery} />
        <UsersTable
          users={displayUsers}
          onUserClick={onUserClick}
          getDaysUntilHardDelete={getDaysUntilHardDelete}
          hasMore={false}
          isSearchMode={isSearchMode}
          loadingMore={false}
          onLoadMore={onLoadMore}
        />
      </>
    );
  }

  if (displayUsers.length > 0) {
    return (
      <UsersTable
        users={displayUsers}
        onUserClick={onUserClick}
        getDaysUntilHardDelete={getDaysUntilHardDelete}
        hasMore={hasMore}
        isSearchMode={isSearchMode}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
      />
    );
  }

  if (!error) return <UsersEmptyState isSearchMode={isSearchMode} />;

  return null;
}

/**
 * User row in the table
 */
function UserTableRow({
  user,
  onClick,
  getDaysUntilHardDelete,
}: Readonly<{
  user: UserSearchResult;
  onClick: () => void;
  getDaysUntilHardDelete: (date: string | null | undefined) => number | null;
}>) {
  return (
    <tr onClick={onClick} className="hover:bg-amber-50/50 cursor-pointer transition-colors">
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
        <UserStatusBadge user={user} getDaysUntilHardDelete={getDaysUntilHardDelete} />
      </td>
    </tr>
  );
}

/**
 * Load more pagination button
 */
function LoadMoreButton({ onClick, loading }: Readonly<{ onClick: () => void; loading: boolean }>) {
  return (
    <div className="p-4 border-t border-amber-100 flex justify-center">
      <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 disabled:opacity-50"
      >
        {loading ? (
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
  );
}

/**
 * Search mode result indicator
 */
function SearchResultIndicator({ count, query }: Readonly<{ count: number; query: string }>) {
  return (
    <div className="text-sm text-amber-700">
      Found {count} user(s) matching &ldquo;{query}&rdquo;
    </div>
  );
}

/**
 * User table header row
 */
function UserTableHeader() {
  return (
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
  );
}

/**
 * Users table component
 */
function UsersTable({
  users,
  onUserClick,
  getDaysUntilHardDelete,
  hasMore,
  isSearchMode,
  loadingMore,
  onLoadMore,
}: Readonly<{
  users: UserSearchResult[];
  onUserClick: (uid: string) => void;
  getDaysUntilHardDelete: (date: string | null | undefined) => number | null;
  hasMore: boolean;
  isSearchMode: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}>) {
  return (
    <div className="bg-white rounded-lg border border-amber-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <UserTableHeader />
          <tbody className="divide-y divide-amber-50">
            {users.map((user) => (
              <UserTableRow
                key={user.uid}
                user={user}
                onClick={() => onUserClick(user.uid)}
                getDaysUntilHardDelete={getDaysUntilHardDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
      {!isSearchMode && hasMore && <LoadMoreButton onClick={onLoadMore} loading={loadingMore} />}
    </div>
  );
}

/**
 * User profile section in detail drawer
 */
function UserProfileSection({ profile }: Readonly<{ profile: UserProfile }>) {
  return (
    <div className="bg-amber-50 rounded-lg p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center">
          <Users className="w-8 h-8 text-amber-700" />
        </div>
        <div>
          <h3 className="text-lg font-heading text-amber-900">{profile.nickname}</h3>
          <p className="text-sm text-amber-600">{profile.email || "No email"}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-amber-600">UID:</span>
          <p className="font-mono text-xs text-amber-900 break-all">{profile.uid}</p>
        </div>
        <div>
          <span className="text-amber-600">Provider:</span>
          <p className="text-amber-900">{profile.provider}</p>
        </div>
        <div>
          <span className="text-amber-600">Created:</span>
          <p className="text-amber-900">
            {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
          </p>
        </div>
        <div>
          <span className="text-amber-600">Last Sign In:</span>
          <p className="text-amber-900">
            {formatDistanceToNow(new Date(profile.lastSignIn), { addSuffix: true })}
          </p>
        </div>
        {profile.soberDate && (
          <div>
            <span className="text-amber-600">Sober Date:</span>
            <p className="text-amber-900">{new Date(profile.soberDate).toLocaleDateString()}</p>
          </div>
        )}
        <div>
          <span className="text-amber-600">Email Verified:</span>
          <p className="text-amber-900">{profile.emailVerified ? "Yes" : "No"}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * User stats section in detail drawer
 */
function UserStatsSection({ stats }: Readonly<{ stats: UserDetail["stats"] }>) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white border border-amber-100 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-amber-900">{stats.totalJournalEntries}</div>
        <div className="text-xs text-amber-600">Journal Entries</div>
      </div>
      <div className="bg-white border border-amber-100 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-amber-900">{stats.totalCheckIns}</div>
        <div className="text-xs text-amber-600">Check-Ins</div>
      </div>
      <div className="bg-white border border-amber-100 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-amber-900">{stats.totalInventory}</div>
        <div className="text-xs text-amber-600">Inventory</div>
      </div>
    </div>
  );
}

/**
 * Admin notes section in detail drawer
 */
function AdminNotesSection({
  notes,
  editing,
  adminNotes,
  setAdminNotes,
  saving,
  onStartEdit,
  onSave,
  onCancel,
}: Readonly<{
  notes: string | null;
  editing: boolean;
  adminNotes: string;
  setAdminNotes: (v: string) => void;
  saving: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}>) {
  return (
    <div className="bg-white border border-amber-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-amber-900">Admin Notes</h4>
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={saving}
              className="px-3 py-1 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={onStartEdit} className="p-1 hover:bg-amber-50 rounded transition-colors">
            <Edit2 className="w-4 h-4 text-amber-600" />
          </button>
        )}
      </div>
      {editing ? (
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={4}
          className="w-full border border-amber-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="Add admin notes..."
        />
      ) : (
        <p className="text-sm text-amber-700 whitespace-pre-wrap">{notes || "No notes"}</p>
      )}
    </div>
  );
}

/**
 * User privilege section in detail drawer
 */
function UserPrivilegeSection({
  profile,
  privilegeTypes,
  selectedPrivilege,
  setSelectedPrivilege,
  savingPrivilege,
  onSave,
}: Readonly<{
  profile: UserProfile;
  privilegeTypes: PrivilegeType[];
  selectedPrivilege: string;
  setSelectedPrivilege: (v: string) => void;
  savingPrivilege: boolean;
  onSave: () => void;
}>) {
  return (
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
          onClick={onSave}
          disabled={savingPrivilege || selectedPrivilege === (profile.privilegeType || "free")}
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
      {profile.isAdmin && (
        <p className="text-xs text-amber-600 mt-2">
          This user has admin access to the admin panel.
        </p>
      )}
    </div>
  );
}

/**
 * Soft delete warning banner in detail drawer
 */
function SoftDeleteBanner({
  profile,
  getDaysUntilHardDelete,
  onUndelete,
  undeletingUser,
}: Readonly<{
  profile: UserProfile;
  getDaysUntilHardDelete: (date: string | null | undefined) => number | null;
  onUndelete: () => void;
  undeletingUser: boolean;
}>) {
  if (!profile.isSoftDeleted) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Trash2 className="w-5 h-5 text-orange-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-orange-900">Scheduled for Deletion</h4>
          <p className="text-sm text-orange-700 mt-1">
            This user&apos;s account will be permanently deleted in{" "}
            <strong>{getDaysUntilHardDelete(profile.scheduledHardDeleteAt)} days</strong>. All their
            data (journal entries, check-ins, inventory) will be removed.
          </p>
          {profile.softDeleteReason && (
            <p className="text-sm text-orange-600 mt-2">
              <strong>Reason:</strong> {profile.softDeleteReason}
            </p>
          )}
          <button
            onClick={onUndelete}
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
  );
}

/**
 * Admin actions section in detail drawer
 */
function AdminActionsSection({
  profile,
  saving,
  sendingPasswordReset,
  passwordResetSent,
  deletingUser,
  onToggleDisabled,
  onSendPasswordReset,
  onOpenDeleteDialog,
}: Readonly<{
  profile: UserProfile;
  saving: boolean;
  sendingPasswordReset: boolean;
  passwordResetSent: boolean;
  deletingUser: boolean;
  onToggleDisabled: () => void;
  onSendPasswordReset: () => void;
  onOpenDeleteDialog: () => void;
}>) {
  return (
    <div className="bg-white border border-amber-100 rounded-lg p-4">
      <h4 className="font-medium text-amber-900 mb-3">Admin Actions</h4>
      <div className="flex flex-wrap gap-2">
        {!profile.isSoftDeleted && (
          <button
            onClick={onToggleDisabled}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              profile.disabled
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            {profile.disabled ? (
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
          onClick={onSendPasswordReset}
          disabled={sendingPasswordReset || !profile.email}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            passwordResetSent
              ? "bg-green-500 text-white"
              : "bg-amber-500 text-white hover:bg-amber-600"
          }`}
          title={profile.email ? undefined : "User has no email address"}
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
        {!profile.isSoftDeleted && (
          <button
            onClick={onOpenDeleteDialog}
            disabled={deletingUser}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete User
          </button>
        )}
      </div>
      {!profile.email && (
        <p className="text-xs text-amber-600 mt-2">
          Password reset unavailable - user signed up with Google/anonymous auth
        </p>
      )}
    </div>
  );
}

/**
 * Activity item in recent activity list
 */
function ActivityItemRow({ activity }: Readonly<{ activity: ActivityItem }>) {
  return (
    <div className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-lg">
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
        {(activity.hasCravings || activity.cravings || activity.hasUsed || activity.used) && (
          <div className="flex gap-2 mt-1">
            {(activity.hasCravings || activity.cravings) && (
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                Cravings
              </span>
            )}
            {(activity.hasUsed || activity.used) && (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">Used</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Recent activity section in detail drawer
 */
function RecentActivitySection({ activities }: Readonly<{ activities: ActivityItem[] }>) {
  return (
    <div className="bg-white border border-amber-100 rounded-lg p-4">
      <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Recent Activity
      </h4>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-amber-600">No recent activity</p>
        ) : (
          activities.map((activity) => <ActivityItemRow key={activity.id} activity={activity} />)
        )}
      </div>
    </div>
  );
}

/**
 * User detail drawer content (when loaded)
 */
function UserDetailDrawerContent({
  user,
  privilegeTypes,
  selectedPrivilege,
  setSelectedPrivilege,
  savingPrivilege,
  onSavePrivilege,
  editingNotes,
  adminNotes,
  setAdminNotes,
  saving,
  onStartEditNotes,
  onSaveNotes,
  onCancelEditNotes,
  getDaysUntilHardDelete,
  onUndelete,
  undeletingUser,
  sendingPasswordReset,
  passwordResetSent,
  deletingUser,
  onToggleDisabled,
  onSendPasswordReset,
  onOpenDeleteDialog,
}: Readonly<{
  user: UserDetail;
  privilegeTypes: PrivilegeType[];
  selectedPrivilege: string;
  setSelectedPrivilege: (v: string) => void;
  savingPrivilege: boolean;
  onSavePrivilege: () => void;
  editingNotes: boolean;
  adminNotes: string;
  setAdminNotes: (v: string) => void;
  saving: boolean;
  onStartEditNotes: () => void;
  onSaveNotes: () => void;
  onCancelEditNotes: () => void;
  getDaysUntilHardDelete: (date: string | null | undefined) => number | null;
  onUndelete: () => void;
  undeletingUser: boolean;
  sendingPasswordReset: boolean;
  passwordResetSent: boolean;
  deletingUser: boolean;
  onToggleDisabled: () => void;
  onSendPasswordReset: () => void;
  onOpenDeleteDialog: () => void;
}>) {
  return (
    <div className="p-6 space-y-6">
      <UserProfileSection profile={user.profile} />
      <UserStatsSection stats={user.stats} />
      <AdminNotesSection
        notes={user.profile.adminNotes}
        editing={editingNotes}
        adminNotes={adminNotes}
        setAdminNotes={setAdminNotes}
        saving={saving}
        onStartEdit={onStartEditNotes}
        onSave={onSaveNotes}
        onCancel={onCancelEditNotes}
      />
      <UserPrivilegeSection
        profile={user.profile}
        privilegeTypes={privilegeTypes}
        selectedPrivilege={selectedPrivilege}
        setSelectedPrivilege={setSelectedPrivilege}
        savingPrivilege={savingPrivilege}
        onSave={onSavePrivilege}
      />
      <SoftDeleteBanner
        profile={user.profile}
        getDaysUntilHardDelete={getDaysUntilHardDelete}
        onUndelete={onUndelete}
        undeletingUser={undeletingUser}
      />
      <AdminActionsSection
        profile={user.profile}
        saving={saving}
        sendingPasswordReset={sendingPasswordReset}
        passwordResetSent={passwordResetSent}
        deletingUser={deletingUser}
        onToggleDisabled={onToggleDisabled}
        onSendPasswordReset={onSendPasswordReset}
        onOpenDeleteDialog={onOpenDeleteDialog}
      />
      <RecentActivitySection activities={user.recentActivity} />
    </div>
  );
}

/**
 * User detail drawer component
 */
function UserDetailDrawer({
  user,
  loadingDetail,
  onClose,
  ...contentProps
}: {
  user: UserDetail;
  loadingDetail: boolean;
  onClose: () => void;
} & Omit<Parameters<typeof UserDetailDrawerContent>[0], "user">) {
  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-amber-100 p-6 flex items-center justify-between">
        <h2 className="text-xl font-heading text-amber-900">User Details</h2>
        <button onClick={onClose} className="p-2 hover:bg-amber-50 rounded-lg transition-colors">
          <X className="w-5 h-5 text-amber-600" />
        </button>
      </div>
      {loadingDetail ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-amber-600">Loading user details...</div>
        </div>
      ) : (
        <UserDetailDrawerContent user={user} {...contentProps} />
      )}
    </div>
  );
}

/**
 * Drawer overlay component
 */
function DrawerOverlay({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <div
      className="fixed inset-0 bg-black/20 z-40"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
    />
  );
}

/**
 * Delete dialog step 1 - initial confirmation
 */
function DeleteDialogStep1({
  nickname,
  deleteReason,
  setDeleteReason,
  onCancel,
  onContinue,
}: Readonly<{
  nickname: string;
  deleteReason: string;
  setDeleteReason: (v: string) => void;
  onCancel: () => void;
  onContinue: () => void;
}>) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 id="delete-dialog-title" className="text-lg font-semibold text-gray-900">
            Delete User
          </h3>
          <p className="text-sm text-gray-500">This action can be undone within 30 days</p>
        </div>
      </div>
      <p className="text-gray-700 mb-4">
        Are you sure you want to delete <strong>{nickname}</strong>?
      </p>
      <p className="text-sm text-gray-600 mb-4">
        The user will be immediately logged out and unable to sign in. Their data will be
        permanently deleted after 30 days unless restored.
      </p>
      <div className="mb-4">
        <label
          htmlFor="delete-reason-input"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Reason (optional)
        </label>
        <input
          id="delete-reason-input"
          type="text"
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
          placeholder="e.g., User requested account deletion"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onContinue}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Continue
        </button>
      </div>
    </>
  );
}

/**
 * Delete dialog step 2 - type DELETE confirmation
 */
function DeleteDialogStep2({
  nickname,
  deleteConfirmText,
  setDeleteConfirmText,
  deletingUser,
  onBack,
  onDelete,
}: Readonly<{
  nickname: string;
  deleteConfirmText: string;
  setDeleteConfirmText: (v: string) => void;
  deletingUser: boolean;
  onBack: () => void;
  onDelete: () => void;
}>) {
  return (
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
        To confirm deletion of <strong>{nickname}</strong>, type{" "}
        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-mono">DELETE</code>{" "}
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
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
        >
          Back
        </button>
        <button
          onClick={onDelete}
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
  );
}

/**
 * Delete confirmation dialog
 */
function DeleteConfirmationDialog({
  step,
  nickname,
  deleteReason,
  setDeleteReason,
  deleteConfirmText,
  setDeleteConfirmText,
  deletingUser,
  onClose,
  onContinue,
  onBack,
  onDelete,
}: Readonly<{
  step: 1 | 2;
  nickname: string;
  deleteReason: string;
  setDeleteReason: (v: string) => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (v: string) => void;
  deletingUser: boolean;
  onClose: () => void;
  onContinue: () => void;
  onBack: () => void;
  onDelete: () => void;
}>) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
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
          {step === 1 ? (
            <DeleteDialogStep1
              nickname={nickname}
              deleteReason={deleteReason}
              setDeleteReason={setDeleteReason}
              onCancel={onClose}
              onContinue={onContinue}
            />
          ) : (
            <DeleteDialogStep2
              nickname={nickname}
              deleteConfirmText={deleteConfirmText}
              setDeleteConfirmText={setDeleteConfirmText}
              deletingUser={deletingUser}
              onBack={onBack}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>
    </>
  );
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

  // Password reset state (managed by hook for cleanup)
  const selectedUid = selectedUser?.profile.uid;
  const {
    sending: sendingPasswordReset,
    setSending: setSendingPasswordReset,
    sent: passwordResetSent,
    setSuccessWithTimeout: setPasswordResetSuccess,
  } = usePasswordResetTimeout(selectedUid);

  // Soft-delete state
  const [deleteDialogStep, setDeleteDialogStep] = useState<0 | 1 | 2>(0); // 0=closed, 1=confirm, 2=type DELETE
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deletingUser, setDeletingUser] = useState(false);
  const [undeletingUser, setUndeletingUser] = useState(false);

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
        const result = await fetchUsersList({ cursor, sortBy, sortOrder });
        if (isLoadingMore) {
          setUsers((prev) => [...prev, ...result.users]);
        } else {
          setUsers(result.users);
        }
        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor);
      } catch (err) {
        logger.error("Failed to load users", {
          errorType: err instanceof Error ? err.constructor.name : typeof err,
        });
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
    fetchPrivilegeTypesApi()
      .then(setPrivilegeTypes)
      .catch((err) =>
        logger.error("Failed to load privilege types", {
          errorType: err instanceof Error ? err.constructor.name : typeof err,
        })
      );
  }, []);

  // Handle sort change - useCallback for stable reference
  const handleSortChange = useCallback((field: SortField) => {
    setSortBy((prevSortBy) => {
      if (field === prevSortBy) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        return prevSortBy;
      }
      setSortOrder("desc");
      return field;
    });
    setNextCursor(null);
    setUsers([]);
  }, []);

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setIsSearchMode(true);
    setError(null);

    try {
      const result = await searchUsersApi(searchQuery.trim());
      setSearchResults(result.results);
      if (result.results.length === 0) setError("No users found matching your search");
    } catch (err) {
      logger.error("Admin user search failed", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        errorCode: (err as { code?: string })?.code,
      });
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

  // Auto-clear search mode when search field is emptied (custom hook)
  useSearchModeClear(searchQuery, isSearchMode, setSearchResults, setIsSearchMode, setError);

  // Determine which users to display
  const displayUsers = isSearchMode ? searchResults : users;

  async function loadUserDetail(uid: string) {
    setLoadingDetail(true);
    setError(null);

    try {
      const detail = await fetchUserDetailApi(uid);
      setSelectedUser(detail);
      setAdminNotes(detail.profile.adminNotes || "");
      setEditingNotes(false);
      setSelectedPrivilege(detail.profile.privilegeType || "free");
    } catch (err) {
      logger.error("Failed to load user detail", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        userId: maskIdentifier(uid),
      });
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
      await updateAdminNotesApi(selectedUser.profile.uid, adminNotes);
      setSelectedUser({ ...selectedUser, profile: { ...selectedUser.profile, adminNotes } });
      setEditingNotes(false);
    } catch (err) {
      logger.error("Failed to save notes", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        userId: maskIdentifier(selectedUser.profile.uid),
      });
      setError("Failed to save notes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleDisabled() {
    if (!selectedUser) return;
    const newDisabled = !selectedUser.profile.disabled;
    if (!confirm(getToggleDisabledMessage(newDisabled))) return;

    setSaving(true);
    setError(null);
    const reason = newDisabled ? prompt("Reason for disabling (optional):") : undefined;

    try {
      await toggleUserDisabledApi(selectedUser.profile.uid, newDisabled, reason || undefined);
      setSelectedUser({
        ...selectedUser,
        profile: { ...selectedUser.profile, disabled: newDisabled },
      });
      setSearchResults((prev) =>
        updateUserInList(prev, selectedUser.profile.uid, { disabled: newDisabled })
      );
    } catch (err) {
      logger.error("Failed to toggle user status", {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        userId: maskIdentifier(selectedUser.profile.uid),
        newDisabled,
      });
      setError("Failed to update user status. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePrivilege() {
    if (!selectedUser || !selectedPrivilege) return;
    const currentPrivilege = selectedUser.profile.privilegeType || "free";
    if (selectedPrivilege === currentPrivilege) return;
    if (!confirm(getPrivilegeChangeMessage(selectedPrivilege))) {
      setSelectedPrivilege(currentPrivilege);
      return;
    }

    setSavingPrivilege(true);
    setError(null);

    try {
      await setUserPrivilegeApi(selectedUser.profile.uid, selectedPrivilege);
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
      setError("Failed to update user privilege. Please try again.");
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
    )
      return;

    setSendingPasswordReset(true);
    setError(null);

    try {
      await sendPasswordResetApi(selectedUser.profile.email);
      setPasswordResetSuccess();
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

  // SAFETY: Close delete dialog if selected user changes mid-flow (custom hook)
  useDeleteDialogSafety(selectedUid, deleteDialogStep, closeDeleteDialog);

  // ACCESSIBILITY: Global Escape key handler for closing dialogs and drawer (custom hook)
  useEscapeKeyHandler(selectedUid, deleteDialogStep, closeDeleteDialog, setSelectedUser);

  async function handleSoftDelete() {
    if (!selectedUser || deleteConfirmText.trim() !== "DELETE") return;
    const uid = selectedUser.profile.uid;
    const reasonToSave = deleteReason || undefined;
    setDeletingUser(true);
    setError(null);

    try {
      const result = await softDeleteUserApi(uid, reasonToSave);
      setSelectedUser((prev) => {
        if (!prev || prev.profile.uid !== uid) return prev;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            isSoftDeleted: true,
            softDeletedAt: new Date().toISOString(),
            scheduledHardDeleteAt: result.scheduledHardDeleteAt,
            softDeleteReason: reasonToSave || null,
            disabled: true,
          },
        };
      });
      const updates = {
        isSoftDeleted: true,
        scheduledHardDeleteAt: result.scheduledHardDeleteAt,
        disabled: true,
      };
      setUsers((prev) => updateUserInList(prev, uid, updates));
      setSearchResults((prev) => updateUserInList(prev, uid, updates));
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
    const uid = selectedUser.profile.uid;
    if (!confirm("Are you sure you want to restore this user? They will be able to sign in again."))
      return;
    setUndeletingUser(true);
    setError(null);

    try {
      await undeleteUserApi(uid);
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
      const updates = { isSoftDeleted: false, scheduledHardDeleteAt: null, disabled: false };
      setUsers((prev) => updateUserInList(prev, uid, updates));
      setSearchResults((prev) => updateUserInList(prev, uid, updates));
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

  // Callback wrappers to avoid creating new functions in JSX
  const handleLoadMore = useCallback(() => loadUsers(nextCursor), [loadUsers, nextCursor]);
  const handleCloseDrawer = useCallback(() => setSelectedUser(null), []);
  const handleStartEditNotes = useCallback(() => setEditingNotes(true), []);
  const handleCancelEditNotes = useCallback(() => {
    setEditingNotes(false);
    setAdminNotes(selectedUser?.profile.adminNotes || "");
  }, [selectedUser?.profile.adminNotes]);
  const handleSetDeleteDialogStep2 = useCallback(() => setDeleteDialogStep(2), []);
  const handleSetDeleteDialogStep1 = useCallback(() => setDeleteDialogStep(1), []);

  return (
    <div className="space-y-6">
      <SearchBarSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        searching={searching}
        isSearchMode={isSearchMode}
        onClear={clearSearch}
        error={error}
      />

      {!isSearchMode && (
        <SortControlsSection
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      )}

      <UsersListView
        loading={loading}
        isSearchMode={isSearchMode}
        searchResults={searchResults}
        searchQuery={searchQuery}
        displayUsers={displayUsers}
        error={error}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onUserClick={loadUserDetail}
        onLoadMore={handleLoadMore}
        getDaysUntilHardDelete={getDaysUntilHardDelete}
      />

      {selectedUser && (
        <UserDetailDrawer
          user={selectedUser}
          loadingDetail={loadingDetail}
          onClose={handleCloseDrawer}
          privilegeTypes={privilegeTypes}
          selectedPrivilege={selectedPrivilege}
          setSelectedPrivilege={setSelectedPrivilege}
          savingPrivilege={savingPrivilege}
          onSavePrivilege={handleSavePrivilege}
          editingNotes={editingNotes}
          adminNotes={adminNotes}
          setAdminNotes={setAdminNotes}
          saving={saving}
          onStartEditNotes={handleStartEditNotes}
          onSaveNotes={handleSaveNotes}
          onCancelEditNotes={handleCancelEditNotes}
          getDaysUntilHardDelete={getDaysUntilHardDelete}
          onUndelete={handleUndelete}
          undeletingUser={undeletingUser}
          sendingPasswordReset={sendingPasswordReset}
          passwordResetSent={passwordResetSent}
          deletingUser={deletingUser}
          onToggleDisabled={handleToggleDisabled}
          onSendPasswordReset={handleSendPasswordReset}
          onOpenDeleteDialog={openDeleteDialog}
        />
      )}

      {selectedUser && <DrawerOverlay onClose={handleCloseDrawer} />}

      {deleteDialogStep > 0 && selectedUser && (
        <DeleteConfirmationDialog
          step={deleteDialogStep as 1 | 2}
          nickname={selectedUser.profile.nickname}
          deleteReason={deleteReason}
          setDeleteReason={setDeleteReason}
          deleteConfirmText={deleteConfirmText}
          setDeleteConfirmText={setDeleteConfirmText}
          deletingUser={deletingUser}
          onClose={closeDeleteDialog}
          onContinue={handleSetDeleteDialogStep2}
          onBack={handleSetDeleteDialogStep1}
          onDelete={handleSoftDelete}
        />
      )}
    </div>
  );
}
