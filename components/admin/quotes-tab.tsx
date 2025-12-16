import { useState, useEffect } from "react"
import { Quote, QuotesService } from "@/lib/db/quotes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Edit2, Save, Loader2, Quote as QuoteIcon, Calendar as CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// Initial seed data
const SEED_QUOTES = [
    { text: "Serenity is not freedom from the storm, but peace amid the storm.", author: "Unknown" },
    { text: "One day at a time.", author: "Recovery Slogan", source: "Traditional" },
    { text: "Recovery is about progression, not perfection.", author: "Unknown" },
    { text: "The only way out is through.", author: "Robert Frost" },
    { text: "We are people who normally would not mix.", author: "Alcoholics Anonymous", source: "Big Book p. 17" },
    { text: "Faith is doing the footwork and letting go of the results.", author: "Unknown" },
    { text: "Humility is not thinking less of yourself, but thinking of yourself less.", author: "C.S. Lewis" },
]

export function QuotesTab() {
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
    const [formData, setFormData] = useState<Partial<Quote>>({})

    useEffect(() => {
        fetchQuotes()
    }, [])

    const fetchQuotes = async () => {
        setLoading(true)
        try {
            const data = await QuotesService.getAllQuotes()
            setQuotes(data)
        } catch (_error) {
            toast.error("Failed to load quotes")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.text) return toast.error("Quote text is required")

        try {
            if (editingQuote) {
                await QuotesService.updateQuote(editingQuote.id, formData)
                toast.success("Quote updated")
            } else {
                await QuotesService.addQuote(formData as Omit<Quote, "id">)
                toast.success("Quote added")
            }
            setIsDialogOpen(false)
            setEditingQuote(null)
            setFormData({})
            fetchQuotes()
        } catch (_error) {
            toast.error("Failed to save quote")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return
        try {
            await QuotesService.deleteQuote(id)
            toast.success("Quote deleted")
            fetchQuotes()
        } catch (_error) {
            toast.error("Failed to delete quote")
        }
    }

    const handleEdit = (quote: Quote) => {
        setEditingQuote(quote)
        setFormData(quote)
        setIsDialogOpen(true)
    }

    const handleSeed = async () => {
        if (!confirm("Add initial set of recovery quotes?")) return
        try {
            setLoading(true)
            for (const q of SEED_QUOTES) {
                await QuotesService.addQuote(q)
            }
            toast.success("Quotes seeded!")
            fetchQuotes()
        } catch (_err) {
            toast.error("Failed to seed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-heading text-amber-900">Daily Quotes ({quotes.length})</h3>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSeed} className="text-amber-700 border-amber-200">
                        🌱 Seed Data
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-2" onClick={() => { setEditingQuote(null); setFormData({}) }}>
                                <Plus className="w-4 h-4" /> Add Quote
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#fdfbf7] border-amber-200">
                            <DialogHeader>
                                <DialogTitle>{editingQuote ? "Edit Quote" : "Add New Quote"}</DialogTitle>
                                <DialogDescription>Inspirational quotes rotated daily.</DialogDescription>
                            </DialogHeader>
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
                                    <p className="text-[10px] text-amber-900/40">If set, this quote will ALWAYS appear on this date, overriding the rotation.</p>
                                </div>
                                <Button onClick={handleSave} className="w-full bg-amber-600 hover:bg-amber-700">
                                    <Save className="w-4 h-4 mr-2" /> Save Quote
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-amber-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center text-amber-900/40">
                        <Loader2 className="animate-spin mr-2" /> Loading...
                    </div>
                ) : quotes.length === 0 ? (
                    <div className="p-8 text-center text-amber-900/40 italic">
                        No quotes found. Add some or click Seed Data.
                    </div>
                ) : (
                    <div className="divide-y divide-amber-100">
                        {quotes.map(quote => (
                            <div key={quote.id} className="p-4 hover:bg-amber-50 flex justify-between items-start group">
                                <div className="flex gap-3">
                                    <QuoteIcon className="w-5 h-5 text-amber-300 shrink-0 mt-1" />
                                    <div>
                                        <p className="font-heading text-lg text-amber-900 leading-tight">"{quote.text}"</p>
                                        <p className="text-sm text-amber-900/60 mt-1 font-medium">
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
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-700 hover:bg-amber-100" onClick={() => handleEdit(quote)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-700 hover:bg-red-50" onClick={() => handleDelete(quote.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
