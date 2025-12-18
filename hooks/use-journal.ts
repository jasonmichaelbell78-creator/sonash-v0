import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
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

            // QUERY: Get all entries for this user, ordered by newest first
            const q = query(
                collection(db, `users/${user.uid}/journal`),
                where('isSoftDeleted', '==', false), // Hide "crumpled" pages
                orderBy('createdAt', 'desc')
            );

            // REAL-TIME LISTENER
            const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                const fetchedEntries: JournalEntry[] = [];

                snapshot.forEach((doc) => {
                    const data = doc.data();
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

    // ACTION: Tuck Away (Save) a new entry
    const addEntry = async (
        type: JournalEntryType,
        data: any,
        isPrivate: boolean = true
    ) => {
        const user = auth.currentUser;
        if (!user) throw new Error("Must be signed in to write in journal.");

        const today = new Date();
        const dateLabel = today.toLocaleDateString('en-CA'); // "YYYY-MM-DD" local

        await addDoc(collection(db, `users/${user.uid}/journal`), {
            userId: user.uid,
            type,
            data,
            dateLabel,
            isPrivate,
            isSoftDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    };

    // ACTION: Crumple Page (Soft Delete)
    const crumplePage = async (entryId: string) => {
        const user = auth.currentUser;
        if (!user) return;

        const entryRef = doc(db, `users/${user.uid}/journal/${entryId}`);
        await updateDoc(entryRef, {
            isSoftDeleted: true,
            updatedAt: serverTimestamp()
        });
    };

    return {
        entries,        // Raw list
        groupedEntries, // Organized for the UI (Today, Yesterday, etc.)
        loading,
        addEntry,
        crumplePage
    };
}
