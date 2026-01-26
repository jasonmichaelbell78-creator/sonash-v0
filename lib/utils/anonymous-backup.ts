/**
 * Anonymous Backup Utility
 *
 * Provides local backup mechanism for anonymous users to prevent data loss
 * when browser storage is cleared or user switches devices.
 */

import { logger } from "@/lib/logger";
import { getLocalStorage, setLocalStorage, removeLocalStorage } from "@/lib/utils/storage";

const BACKUP_KEY = "sonash_anonymous_backup";
const MAX_ENTRIES = 20; // Keep last 20 entries in backup

interface BackupEntry {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: number;
  dateLabel: string;
}

interface AnonymousBackup {
  userId: string;
  entries: BackupEntry[];
  profile: {
    nickname?: string;
    cleanStart?: number; // Milliseconds timestamp
    hasSponsor?: string;
  };
  lastBackupAt: number;
  version: 1;
}

/**
 * Save a journal entry to local backup
 */
export function backupJournalEntry(userId: string, entry: BackupEntry): void {
  try {
    const backup = getBackup();

    // Initialize or update userId
    if (!backup || backup.userId !== userId) {
      saveBackup({
        userId,
        entries: [entry],
        profile: {},
        lastBackupAt: Date.now(),
        version: 1,
      });
      return;
    }

    // Add entry, keeping only the most recent MAX_ENTRIES
    const existingIndex = backup.entries.findIndex((e) => e.id === entry.id);
    if (existingIndex >= 0) {
      backup.entries[existingIndex] = entry;
    } else {
      backup.entries.unshift(entry);
    }

    backup.entries = backup.entries.slice(0, MAX_ENTRIES);
    backup.lastBackupAt = Date.now();

    saveBackup(backup);
  } catch (error) {
    // Silently fail - backup is best-effort
    logger.warn("Failed to backup journal entry", { error });
  }
}

/**
 * Save profile data to local backup
 */
export function backupProfile(userId: string, profile: AnonymousBackup["profile"]): void {
  try {
    const backup = getBackup();

    if (!backup || backup.userId !== userId) {
      saveBackup({
        userId,
        entries: [],
        profile,
        lastBackupAt: Date.now(),
        version: 1,
      });
      return;
    }

    backup.profile = { ...backup.profile, ...profile };
    backup.lastBackupAt = Date.now();

    saveBackup(backup);
  } catch (error) {
    logger.warn("Failed to backup profile", { error });
  }
}

/**
 * Get the current backup
 */
export function getBackup(): AnonymousBackup | null {
  try {
    // Session #99 (LEGACY-001): Use SSR-safe storage utility
    const data = getLocalStorage(BACKUP_KEY);
    if (!data) return null;
    return JSON.parse(data) as AnonymousBackup;
  } catch {
    return null;
  }
}

/**
 * Check if there's a recoverable backup for a different user
 * (e.g., user cleared auth but backup still exists)
 */
export function hasRecoverableBackup(currentUserId: string): boolean {
  const backup = getBackup();
  if (!backup) return false;

  // Backup exists for a different user with meaningful data
  return (
    backup.userId !== currentUserId &&
    (backup.entries.length > 0 || backup.profile.cleanStart !== undefined)
  );
}

/**
 * Get backup stats for UI display
 */
export function getBackupStats(): { entryCount: number; lastBackup: Date | null } | null {
  const backup = getBackup();
  if (!backup) return null;

  return {
    entryCount: backup.entries.length,
    lastBackup: backup.lastBackupAt ? new Date(backup.lastBackupAt) : null,
  };
}

/**
 * Clear the backup (call after successful account link)
 */
export function clearBackup(): void {
  // Session #99 (LEGACY-001): Use SSR-safe storage utility
  removeLocalStorage(BACKUP_KEY);
}

// Private helper
// Session #99 (LEGACY-001): Use SSR-safe storage utility
function saveBackup(backup: AnonymousBackup): void {
  setLocalStorage(BACKUP_KEY, JSON.stringify(backup));
}
