"use client"

import { useState } from "react"
import { Download, Trash2, AlertTriangle, Loader2, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { exportUserData, downloadUserDataAsJson, deleteUserAccount } from "@/lib/user-data-service"
import { useAuthCore } from "@/components/providers/auth-context"
import { auth } from "@/lib/firebase"

interface DataManagementSectionProps {
    onAccountDeleted?: () => void
}

/**
 * Privacy & Data section for settings
 * 
 * Provides GDPR-compliant data export and account deletion.
 */
export function DataManagementSection({ onAccountDeleted }: DataManagementSectionProps) {
    const { user } = useAuthCore()
    const [isExporting, setIsExporting] = useState(false)
    const [exportComplete, setExportComplete] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    const handleExport = async () => {
        if (!user) return

        setIsExporting(true)
        try {
            const data = await exportUserData(user.uid)
            downloadUserDataAsJson(data)
            setExportComplete(true)
            setTimeout(() => setExportComplete(false), 3000)
            toast.success("Your data has been downloaded")
        } catch (error) {
            toast.error("Failed to export data. Please try again.")
        } finally {
            setIsExporting(false)
        }
    }

    const handleDelete = async () => {
        if (!user || deleteConfirmText !== "DELETE") return

        setIsDeleting(true)
        try {
            await deleteUserAccount(user.uid, "DELETE")
            toast.success("Your account has been deleted")

            // Sign out and redirect
            await auth.signOut()
            onAccountDeleted?.()
        } catch (error) {
            toast.error("Failed to delete account. Please try again.")
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <h3 className="font-handlee text-lg text-stone-700 border-b border-stone-200 pb-1">
                Privacy & Data
            </h3>

            {/* Export Data */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                    <Download className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-handlee text-sm text-stone-700">
                            <strong>Download My Data</strong>
                        </p>
                        <p className="text-xs text-stone-600 mt-1">
                            Export all your journal entries and profile as a JSON file.
                        </p>
                        <button
                            onClick={handleExport}
                            disabled={isExporting || !user}
                            className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-handlee rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : exportComplete ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Downloaded!
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Download Data
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Account */}
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-3">
                    <Trash2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-handlee text-sm text-stone-700">
                            <strong>Delete My Account</strong>
                        </p>
                        <p className="text-xs text-stone-600 mt-1">
                            Permanently delete your account and all journal entries. This cannot be undone.
                        </p>

                        <AnimatePresence mode="wait">
                            {!showDeleteConfirm ? (
                                <motion.button
                                    key="delete-button"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="mt-2 px-3 py-1.5 bg-red-600 text-white text-sm font-handlee rounded hover:bg-red-700 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Account
                                </motion.button>
                            ) : (
                                <motion.div
                                    key="delete-confirm"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 space-y-2"
                                >
                                    <div className="flex items-center gap-2 text-red-700 bg-red-100 p-2 rounded">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-xs font-medium">
                                            This will permanently delete all your data!
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-600">
                                        Type <strong>DELETE</strong> to confirm:
                                    </p>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="Type DELETE"
                                        className="w-full px-2 py-1.5 border border-red-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                        disabled={isDeleting}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDelete}
                                            disabled={deleteConfirmText !== "DELETE" || isDeleting}
                                            className="px-3 py-1.5 bg-red-600 text-white text-sm font-handlee rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                "Confirm Delete"
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDeleteConfirm(false)
                                                setDeleteConfirmText("")
                                            }}
                                            disabled={isDeleting}
                                            className="px-3 py-1.5 bg-stone-200 text-stone-700 text-sm font-handlee rounded hover:bg-stone-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}
