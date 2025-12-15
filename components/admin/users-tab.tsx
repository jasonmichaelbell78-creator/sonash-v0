import { Users } from "lucide-react"

export function UsersTab() {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-amber-200 rounded-lg bg-amber-50/50">
            <div className="bg-amber-100 p-3 rounded-full mb-4">
                <Users className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-heading text-amber-900 mb-1">User Management</h3>
            <p className="text-sm text-amber-900/60 max-w-sm">
                This feature is coming soon. You'll be able to manage user accounts, roles, and permissions here.
            </p>
        </div>
    )
}
