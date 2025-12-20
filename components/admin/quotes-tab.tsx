"use client"

/**
 * Quotes Tab - Migrated to use generic AdminCrudTable
 */

import { AdminCrudTable } from "./admin-crud-table"
import { AdminCrudConfig } from "./admin-crud-types"
import { Quote, QuotesService } from "@/lib/db/quotes"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Quote as QuoteIcon, Calendar as CalendarIcon } from "lucide-react"
import { recoverySlogans } from "@/data/slogans"

// Initial seed data - uses first 20 slogans from comprehensive list
const SEED_QUOTES = recoverySlogans.slice(0, 20).map(s => ({
    text: s.text,
    author: s.author,
    source: s.source
}))

// Quotes Form component
function QuotesForm({
    formData,
    setFormData
}: {
    formData: Partial<Quote>
    setFormData: (data: Partial<Quote>) => void
    isEditing: boolean
}) {
    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Quote Text</Label>
                <Textarea
                    value={formData.text || ''}
                    onChange={e => setFormData({ ...formData, text: e.target.value })}
                    className="bg-white"
                    placeholder="Serenity is..."
                />
            </div>
            <div className="space-y-2">
                <Label>Author</Label>
                <Input
                    value={formData.author || ''}
                    onChange={e => setFormData({ ...formData, author: e.target.value })}
                    className="bg-white"
                    placeholder="Unknown, Bill W., etc."
                />
            </div>
            <div className="space-y-2">
                <Label>Source (Optional)</Label>
                <Input
                    value={formData.source || ''}
                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                    className="bg-white"
                    placeholder="Big Book, 12&12, etc."
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
                <p className="text-[10px] text-gray-500">If set, this quote will ALWAYS appear on this date, overriding the rotation.</p>
            </div>
        </div>
    )
}

// Seed helper
async function seedQuotes() {
    for (const q of SEED_QUOTES) {
        await QuotesService.addQuote(q)
    }
}

// Adapter to make QuotesService match CrudService interface
const quotesServiceAdapter = {
    getAll: () => QuotesService.getAllQuotes(),
    add: (data: Omit<Quote, 'id'>) => QuotesService.addQuote(data).then(() => { }),
    update: (id: string, data: Partial<Quote>) => QuotesService.updateQuote(id, data),
    delete: (id: string) => QuotesService.deleteQuote(id),
}

// Configuration for quotes
const quotesConfig: AdminCrudConfig<Quote> = {
    entityName: "Quote",
    entityNamePlural: "Quotes",

    // Use adapter for direct Firestore service
    service: quotesServiceAdapter,

    // Table columns
    columns: [
        {
            key: "text",
            label: "Quote",
            render: (quote) => (
                <div className="flex gap-3">
                    <QuoteIcon className="w-5 h-5 text-amber-300 shrink-0 mt-1" />
                    <div>
                        <p className="font-heading text-lg text-gray-900 leading-tight">"{quote.text}"</p>
                        <p className="text-sm text-gray-600 mt-1 font-medium">
                            — {quote.author || "Unknown"}
                            {quote.source && <span className="font-normal italic opacity-75"> ({quote.source})</span>}
                        </p>
                        {quote.scheduledDate && (
                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                <CalendarIcon className="w-3 h-3" />
                                Scheduled: {quote.scheduledDate}
                            </div>
                        )}
                    </div>
                </div>
            )
        },
    ],

    // Search fields
    searchFields: ["text", "author", "source"],

    // Form component
    FormComponent: QuotesForm,

    // Empty form data
    emptyFormData: {
        text: "",
        author: "",
    },

    // Reset/Seed functionality
    showResetButton: true,
    resetData: seedQuotes,

    // Validation
    validateForm: (data) => {
        if (!data.text) return "Quote text is required"
        return null
    },
}

export function QuotesTab() {
    return <AdminCrudTable config={quotesConfig} />
}
