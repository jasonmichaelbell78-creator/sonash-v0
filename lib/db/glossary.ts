import { db } from "../firebase"
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"

export interface GlossaryTerm {
    id: string
    term: string
    definition: string
    category: 'acronyms' | 'clinical' | 'culture' | 'slang'
    createdAt?: Timestamp
    [key: string]: unknown
}

const COLLECTION = "glossary"

export const GlossaryService = {
    getAllTerms: async (): Promise<GlossaryTerm[]> => {
        const q = query(collection(db, COLLECTION))
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GlossaryTerm))
    },

    addTerm: async (term: Omit<GlossaryTerm, "id">) => {
        return await addDoc(collection(db, COLLECTION), {
            ...term,
            createdAt: Timestamp.now()
        })
    },

    updateTerm: async (id: string, data: Partial<GlossaryTerm>) => {
        const ref = doc(db, COLLECTION, id)
        await updateDoc(ref, data)
    },

    deleteTerm: async (id: string) => {
        await deleteDoc(doc(db, COLLECTION, id))
    },
}
