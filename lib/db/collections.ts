/**
 * Typed Firestore Collection Helpers
 *
 * CANON-0077, CANON-0080: Centralized type-safe collection access
 *
 * Provides:
 * - Collection name constants (prevents typos)
 * - Type-safe collection references
 * - Common query patterns
 */

import {
  collection,
  doc,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Re-export types for convenience
import type { Meeting } from './meetings';
import type { Quote } from './quotes';
import type { Slogan } from './slogans';
import type { SoberLivingHome } from './sober-living';

/**
 * Collection name constants
 * Single source of truth for all Firestore collection paths
 */
export const COLLECTIONS = {
  // Root collections
  MEETINGS: 'meetings',
  DAILY_QUOTES: 'daily_quotes',
  SLOGANS: 'slogans',
  SOBER_LIVING: 'sober_living',
  GLOSSARY: 'recovery_glossary',
  LIBRARY: 'library',
  USERS: 'users',
  RATE_LIMITS: 'rate_limits',

  // User subcollections (use with user ID)
  userJournal: (userId: string) => `users/${userId}/journal`,
  userDailyLogs: (userId: string) => `users/${userId}/daily_logs`,
  userInventory: (userId: string) => `users/${userId}/inventory`,
  userWorksheets: (userId: string) => `users/${userId}/worksheets`,
} as const;

/**
 * Type mapping for collections
 */
export interface CollectionTypes {
  meetings: Meeting;
  daily_quotes: Quote;
  slogans: Slogan;
  sober_living: SoberLivingHome;
  // Add more as needed
}

/**
 * Get typed collection reference
 *
 * @example
 * ```ts
 * const meetingsRef = getCollection('meetings');
 * const snapshot = await getDocs(meetingsRef);
 * // snapshot.docs are typed as Meeting
 * ```
 */
export function getCollection<K extends keyof CollectionTypes>(
  collectionName: K
): CollectionReference<CollectionTypes[K]> {
  return collection(db, collectionName) as CollectionReference<CollectionTypes[K]>;
}

/**
 * Get typed document reference
 *
 * @example
 * ```ts
 * const meetingRef = getDocument('meetings', 'meeting-123');
 * const snapshot = await getDoc(meetingRef);
 * // snapshot.data() is typed as Meeting | undefined
 * ```
 */
export function getDocument<K extends keyof CollectionTypes>(
  collectionName: K,
  documentId: string
): DocumentReference<CollectionTypes[K]> {
  return doc(db, collectionName, documentId) as DocumentReference<CollectionTypes[K]>;
}

/**
 * Get user subcollection reference (untyped - subcollections have varying types)
 *
 * @example
 * ```ts
 * const journalRef = getUserCollection(userId, 'journal');
 * ```
 */
export function getUserCollection(
  userId: string,
  subcollection: 'journal' | 'daily_logs' | 'inventory' | 'worksheets'
): CollectionReference {
  return collection(db, COLLECTIONS.USERS, userId, subcollection);
}

/**
 * Get user document reference
 */
export function getUserDocument(
  userId: string,
  subcollection: 'journal' | 'daily_logs' | 'inventory' | 'worksheets',
  documentId: string
): DocumentReference {
  return doc(db, COLLECTIONS.USERS, userId, subcollection, documentId);
}

/**
 * Build a user subcollection path string
 * Useful for queries and Cloud Function references
 */
export function buildUserPath(
  userId: string,
  subcollection: 'journal' | 'daily_logs' | 'inventory' | 'worksheets'
): string {
  switch (subcollection) {
    case 'journal':
      return COLLECTIONS.userJournal(userId);
    case 'daily_logs':
      return COLLECTIONS.userDailyLogs(userId);
    case 'inventory':
      return COLLECTIONS.userInventory(userId);
    case 'worksheets':
      return COLLECTIONS.userWorksheets(userId);
  }
}
