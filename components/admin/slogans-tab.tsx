"use client"

/**
 * Slogans Tab - Admin CRUD for recovery slogans & sayings
 */

import { AdminCrudTable } from "./admin-crud-table"
import { AdminCrudConfig } from "./admin-crud-types"
import { Slogan, SlogansService } from "@/lib/db/slogans"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Lightbulb } from "lucide-react"
import { recoverySlogans } from "@/data/slogans"

// Seed from static data file
async function seedSlogans() {
    for (const item of recoverySlogans) {
        await SlogansService.addSlogan({
            text: item.text,
            author: item.author,
            source: item.source
        })
    }
}

// Form component
function SlogansForm({
    formData,
    setFormData
}: {
    formData: Partial<Slogan>
    setFormData: (data: Partial<Slogan>) => void
}) {
    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Slogan Text</Label>
                <Textarea
                    value={formData.text || ''}
                    onChange={e => setFormData({ ...formData, text: e.target.value })}
                    className="bg-white"
                    placeholder="One day at a time..."
                    rows={3}
                />
            </div>
            <div className="space-y-2">
                <Label>Author/Attribution</Label>
                <Input
                    value={formData.author || ''}
                    onChange={e => setFormData({ ...formData, author: e.target.value })}
                    className="bg-white"
                    placeholder="Traditional, AA, etc."
                />
            </div>
            <div className="space-y-2">
                <Label>Source (Optional)</Label>
                <Input
                    value={formData.source || ''}
                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                    className="bg-white"
                    placeholder="AA Slogan, Big Book, etc."
                />
            </div>
            <div className="space-y-2">
                <Label>Schedule for Date (Optional)</Label>
                <Input
                    type="date"
                    value={formData.scheduledDate || ''}
                    onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="bg-white"
                />
                <p className="text-[10px] text-gray-500">If set, this slogan will appear on this specific date.</p>
            </div>
            <div className="space-y-2">
                <Label>Time of Day (Optional)</Label>
                <select
                    value={formData.scheduledTimeOfDay || ''}
                    onChange={e => setFormData({ ...formData, scheduledTimeOfDay: e.target.value ? e.target.value as 'morning' | 'afternoon' | 'evening' : undefined })}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                >
                    <option value="">Any time</option>
                    <option value="morning">Morning (12 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                    <option value="evening">Evening (6 PM - 12 AM)</option>
                </select>
                <p className="text-[10px] text-gray-500">Requires a scheduled date. Allows you to show different slogans for morning/afternoon/evening.</p>
            </div>
        </div>
    )
}

// Adapter to match CrudService interface
const slogansServiceAdapter = {
    getAll: () => SlogansService.getAllSlogans(),
    add: (data: Omit<Slogan, 'id'>) => SlogansService.addSlogan(data).then(() => { }),
    update: (id: string, data: Partial<Slogan>) => SlogansService.updateSlogan(id, data),
    delete: (id: string) => SlogansService.deleteSlogan(id),
}

// Configuration
const slogansConfig: AdminCrudConfig<Slogan> = {
    entityName: "Slogan",
    entityNamePlural: "Recovery Slogans",

    service: slogansServiceAdapter,

    columns: [
        {
            key: "text",
            label: "Slogan",
            render: (item) => (
                <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-heading text-lg text-gray-900 leading-tight">{item.text}</p>
                        <p className="text-sm text-gray-600 mt-1">
                            — {item.author}
                            {item.source && <span className="italic opacity-75"> ({item.source})</span>}
                        </p>
                    </div>
                </div>
            )
        },
    ],

    searchFields: ["text", "author", "source"],

    FormComponent: SlogansForm,

    emptyFormData: {
        text: "",
        author: "",
        source: "",
    },

    showResetButton: true,
    resetData: seedSlogans,

    validateForm: (data) => {
        if (!data.text) return "Slogan text is required"
        if (!data.author) return "Author/attribution is required"
        return null
    },
}

export function SlogansTab() {
    return <AdminCrudTable config={slogansConfig} />
}
