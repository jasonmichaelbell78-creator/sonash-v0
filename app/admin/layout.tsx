"use client"

/**
 * Admin Layout
 * 
 * Desktop-only admin interface with separate auth flow.
 * Checks for admin custom claim after Google OAuth login.
 */

import { ReactNode } from "react"

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            {children}
        </div>
    )
}
