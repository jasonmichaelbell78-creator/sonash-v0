import { getFunctions, httpsCallable } from "firebase/functions"
import { logger, maskIdentifier } from "./logger"

/**
 * User Data Service
 * 
 * Client-side service for GDPR-compliant data operations.
 * All operations call secure Cloud Functions.
 */

export interface UserDataExport {
    profile: {
        uid: string
        email: string | null
        nickname: string
        cleanStart: { seconds: number; nanoseconds: number } | null
        createdAt: { seconds: number; nanoseconds: number }
        updatedAt: { seconds: number; nanoseconds: number }
        preferences: {
            theme: string
            largeText: boolean
            simpleLanguage: boolean
        }
    } | null
    dailyLogs: Array<{
        id: string
        content?: string
        mood?: string
        cravings?: boolean
        used?: boolean
        updatedAt?: { seconds: number; nanoseconds: number }
    }>
    exportedAt: string
}

interface ExportResponse {
    success: boolean
    data: UserDataExport
}

interface DeleteResponse {
    success: boolean
    message: string
}

/**
 * Export all user data as JSON
 * 
 * Downloads the user's complete data including:
 * - Profile (nickname, clean date, preferences)
 * - All journal entries
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
    logger.info("Requesting data export", { userId: maskIdentifier(userId) })

    const functions = getFunctions()
    const exportFn = httpsCallable<void, ExportResponse>(functions, "exportUserData")

    const result = await exportFn()

    if (!result.data.success) {
        throw new Error("Export failed")
    }

    logger.info("Data export complete", {
        userId: maskIdentifier(userId),
        logCount: result.data.data.dailyLogs.length,
    })

    return result.data.data
}

/**
 * Trigger JSON download of user data in browser
 */
export function downloadUserDataAsJson(data: UserDataExport, filename?: string): void {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename || `sonash-data-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

/**
 * Permanently delete user account and all data
 * 
 * IRREVERSIBLE! User must provide confirmation = "DELETE"
 */
export async function deleteUserAccount(userId: string, confirmation: string): Promise<void> {
    if (confirmation !== "DELETE") {
        throw new Error("You must type 'DELETE' to confirm account deletion")
    }

    logger.warn("Requesting account deletion", { userId: maskIdentifier(userId) })

    const functions = getFunctions()
    const deleteFn = httpsCallable<{ confirmation: string }, DeleteResponse>(
        functions,
        "deleteUserAccount"
    )

    const result = await deleteFn({ confirmation })

    if (!result.data.success) {
        throw new Error("Deletion failed")
    }

    logger.warn("Account deleted", { userId: maskIdentifier(userId) })
}
