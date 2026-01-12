import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logger } from "@/lib/logger";

// ==================== TYPES ====================

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  description: string;
  category: "official" | "online" | "crisis" | "local" | "treatment" | "housing" | "harm-reduction";
  order: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Prayer {
  id: string;
  title: string;
  text: string;
  category: "morning" | "evening" | "step" | "meditation";
  order: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type QuickLinkInput = Omit<QuickLink, "id" | "createdAt" | "updatedAt">;
export type PrayerInput = Omit<Prayer, "id" | "createdAt" | "updatedAt">;

// ==================== QUICK LINKS ====================

export async function getAllQuickLinks(includeInactive = false): Promise<QuickLink[]> {
  try {
    const linksRef = collection(db, "quick_links");
    const q = includeInactive
      ? query(linksRef, orderBy("category"), orderBy("order"))
      : query(linksRef, where("isActive", "==", true), orderBy("category"), orderBy("order"));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as QuickLink
    );
  } catch (error) {
    logger.error("Error fetching quick links", { error });
    return [];
  }
}

export async function addQuickLink(link: QuickLinkInput): Promise<string> {
  const linksRef = collection(db, "quick_links");
  const docRef = await addDoc(linksRef, {
    ...link,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateQuickLink(id: string, updates: Partial<QuickLinkInput>): Promise<void> {
  const linkRef = doc(db, "quick_links", id);
  await updateDoc(linkRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteQuickLink(id: string): Promise<void> {
  const linkRef = doc(db, "quick_links", id);
  await deleteDoc(linkRef);
}

export async function toggleQuickLinkActive(id: string, isActive: boolean): Promise<void> {
  await updateQuickLink(id, { isActive });
}

// ==================== PRAYERS ====================

export async function getAllPrayers(includeInactive = false): Promise<Prayer[]> {
  try {
    const prayersRef = collection(db, "prayers");
    const q = includeInactive
      ? query(prayersRef, orderBy("category"), orderBy("order"))
      : query(prayersRef, where("isActive", "==", true), orderBy("category"), orderBy("order"));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Prayer
    );
  } catch (error) {
    logger.error("Error fetching prayers", { error });
    return [];
  }
}

export async function addPrayer(prayer: PrayerInput): Promise<string> {
  const prayersRef = collection(db, "prayers");
  const docRef = await addDoc(prayersRef, {
    ...prayer,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updatePrayer(id: string, updates: Partial<PrayerInput>): Promise<void> {
  const prayerRef = doc(db, "prayers", id);
  await updateDoc(prayerRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePrayer(id: string): Promise<void> {
  const prayerRef = doc(db, "prayers", id);
  await deleteDoc(prayerRef);
}

export async function togglePrayerActive(id: string, isActive: boolean): Promise<void> {
  await updatePrayer(id, { isActive });
}
