import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth } from '@/lib/firebase';
import { JournalEntry, JournalEntryType } from '@/types/journal';

// Helper to check for "Today" and "Yesterday"
export const getRelativeDateLabel = (dateString: string) => {
    // Use local time for date comparison to match user's perspective
    const now = new Date();
    const today = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toLocaleDateString('en-CA');

    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';

    // Return formatted date (e.g., "Dec 15, 2025")
    // Using dateString explicitly to avoid timezone shifts
    const [year, month, day] = dateString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

// Generate searchable text from entry data for full-text search
export function generateSearchableText(type: JournalEntryType, data: Record<string, unknown>): string {
    const parts: string[] = [];

    switch (type) {
        case 'daily-log':
            parts.push(String(data.content || ''));
            break;
        case 'gratitude':
            parts.push(...(data.items as string[] || []));
            break;
        case 'spot-check':
            parts.push(String(data.action || ''));
            parts.push(...(data.feelings as string[] || []));
            parts.push(...(data.absolutes as string[] || []));
            break;
        case 'night-review':
            parts.push(String(data.step4_gratitude || ''));
            parts.push(String(data.step4_surrender || ''));
            if (data.step3_reflections) {
                Object.values(data.step3_reflections as Record<string, unknown>).forEach((v: unknown) => parts.push(String(v || '')));
            }
            break;
        case 'free-write':
        case 'meeting-note':
            parts.push(String(data.title || ''), String(data.content || ''));
            break;
        case 'mood':
            parts.push(String(data.note || ''));
            break;
        case 'inventory':
            parts.push(String(data.resentments || ''), String(data.dishonesty || ''), String(data.apologies || ''), String(data.successes || ''));
            break;
    }

    return parts.filter(Boolean).join(' ').toLowerCase().trim();
}

// Generate auto-tags from entry type and data
export function generateTags(type: JournalEntryType, data: Record<string, unknown>): string[] {
    const tags: string[] = [type];

    // Mood-based tags
    if (data.mood) tags.push(`mood-${data.mood}`);

    // Status tags
    if (data.cravings) tags.push('cravings');
    if (data.used) tags.push('relapse');

    // Feeling tags (from spot-check)
    if (data.feelings && Array.isArray(data.feelings)) {
        tags.push(...data.feelings.map((f: string) => f.toLowerCase()));
    }

    // Absolute tags (from spot-check)
    if (data.absolutes && Array.isArray(data.absolutes)) {
        tags.push(...data.absolutes.map((a: string) => a.toLowerCase()));
    }

    return [...new Set(tags)]; // Deduplicate
}

export function useJournal() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupedEntries, setGroupedEntries] = useState<Record<string, JournalEntry[]>>({});

    useEffect(() => {
        // Note: auth.currentUser might be null on initial render depending on auth state speed.
        // In a real app we might want to listen to onAuthStateChanged, but for now we follow the pattern.
        // If this runs before auth is ready, it might return early.
        // Ideally we rely on an AuthContext, but direct access is what was requested.
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (!user) {
                setLoading(false);
                setEntries([]);
                setGroupedEntries({});
                return;
            }

            // QUERY: Get entries for this user, ordered by newest first
            // Note: Using simple query without where clause to avoid composite index requirement
            // Client-side will filter out soft-deleted entries
            // PERFORMANCE: Limit to 100 entries initially to prevent unbounded fetches
            const q = query(
                collection(db, `users/${user.uid}/journal`),
                orderBy('createdAt', 'desc'),
                limit(100)
            );

            // REAL-TIME LISTENER
            const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                const fetchedEntries: JournalEntry[] = [];

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    // Filter out soft-deleted entries client-side
                    if (data.isSoftDeleted) return;

                    fetchedEntries.push({
                        id: doc.id,
                        ...data,
                        // Convert Firestore Timestamp to millis if necessary, or keep as is if types match
                        // transform timestamps to numbers or Date objects if needed for client side consistent typing
                        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
                        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now()
                    } as JournalEntry);
                });

                setEntries(fetchedEntries);

                // GROUPING LOGIC (The "Index" for your notebook)
                const groups: Record<string, JournalEntry[]> = {};
                fetchedEntries.forEach((entry) => {
                    const label = getRelativeDateLabel(entry.dateLabel);
                    if (!groups[label]) groups[label] = [];
                    groups[label].push(entry);
                });

                setGroupedEntries(groups);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching journal entries:", error);
                setLoading(false);
            });

            return () => unsubscribeSnapshot();
        });

        return () => unsubscribeAuth();
    }, []);

    // ACTION: Tuck Away (Save) a new entry with metadata
    // Memoized to prevent infinite re-renders when used in component useCallback deps
    const addEntry = useCallback(async (
        type: JournalEntryType,
        data: Record<string, unknown>,
        isPrivate: boolean = true
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const user = auth.currentUser;
            if (!user) {
                return {
                    success: false,
                    error: "Must be signed in to write in journal."
                };
            }

            const today = new Date();
            const dateLabel = today.toLocaleDateString('en-CA'); // "YYYY-MM-DD" local

            // Generate searchable text
            const searchableText = generateSearchableText(type, data);

            // Generate auto-tags
            const tags = generateTags(type, data);

            // Denormalized fields for efficient querying
            const denormalized: Record<string, unknown> = {};
            if ('cravings' in data) denormalized.hasCravings = data.cravings;
            if ('used' in data) denormalized.hasUsed = data.used;
            if ('mood' in data) denormalized.mood = data.mood;

            // Call Cloud Function instead of direct Firestore write
            // This ensures rate limiting, App Check, and validation are enforced server-side
            const functions = getFunctions();
            const saveJournalEntry = httpsCallable(functions, 'saveJournalEntry');

            await saveJournalEntry({
                type,
                data,
                dateLabel,
                isPrivate,
                searchableText,
                tags,
                ...denormalized,
            });

            return { success: true };
        } catch (error: unknown) {
            // Handle rate limiting and App Check errors with user-friendly messages
            let errorMessage = 'Failed to save entry. Please try again.';

            if (error && typeof error === 'object' && 'code' in error) {
                const code = (error as { code: string }).code;
                if (code === 'functions/resource-exhausted') {
                    errorMessage = 'Too many requests. Please wait a moment and try again.';
                } else if (code === 'functions/failed-precondition') {
                    errorMessage = 'Security verification failed. Please refresh the page.';
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }, []);

    // ACTION: Crumple Page (Soft Delete)
    // Memoized to prevent infinite re-renders
    const crumplePage = useCallback(async (entryId: string) => {
        const user = auth.currentUser;
        if (!user) return;

        const entryRef = doc(db, `users/${user.uid}/journal/${entryId}`);
        await updateDoc(entryRef, {
            isSoftDeleted: true,
            updatedAt: serverTimestamp()
        });
    }, []);

    return {
        entries,        // Raw list
        groupedEntries, // Organized for the UI (Today, Yesterday, etc.)
        loading,
        addEntry,
        crumplePage
    };
}
