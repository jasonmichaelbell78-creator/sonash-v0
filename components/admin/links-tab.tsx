"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react"
import {
    getAllQuickLinks,
    addQuickLink,
    updateQuickLink,
    deleteQuickLink,
    toggleQuickLinkActive,
    type QuickLink,
    type QuickLinkInput
} from "@/lib/db/library"

const CATEGORIES = [
    { value: "official", label: "Official Resources" },
    { value: "online", label: "Online Meetings" },
    { value: "crisis", label: "Crisis Hotlines" },
    { value: "local", label: "Local (Nashville/TN)" },
    { value: "treatment", label: "Treatment & Referral" },
    { value: "housing", label: "Recovery Housing" },
    { value: "harm-reduction", label: "Harm Reduction" }
] as const

export default function LinksTab() {
    const [links, setLinks] = useState<QuickLink[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingLink, setEditingLink] = useState<QuickLink | null>(null)
    const [formData, setFormData] = useState<QuickLinkInput>({
        title: "",
        url: "",
        description: "",
        category: "official",
        order: 0,
        isActive: true
    })

    useEffect(() => {
        async function loadLinks() {
            setLoading(true)
            const data = await getAllQuickLinks(true) // Include inactive
            setLinks(data)
            setLoading(false)
        }
        loadLinks()
    }, [])

    function handleEdit(link: QuickLink) {
        setEditingLink(link)
        setFormData({
            title: link.title,
            url: link.url,
            description: link.description,
            category: link.category,
            order: link.order,
            isActive: link.isActive
        })
        setDialogOpen(true)
    }

    function handleNew() {
        setEditingLink(null)
        setFormData({
            title: "",
            url: "",
            description: "",
            category: "official",
            order: 0,
            isActive: true
        })
        setDialogOpen(true)
    }

    async function handleSave() {
        if (!formData.title || !formData.url || !formData.description) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            if (editingLink) {
                await updateQuickLink(editingLink.id, formData)
                toast.success("Link updated!")
            } else {
                await addQuickLink(formData)
                toast.success("Link added!")
            }
            setDialogOpen(false)
            loadLinks()
        } catch (error) {
            console.error(error)
            toast.error("Failed to save link")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this link?")) return

        try {
            await deleteQuickLink(id)
            toast.success("Link deleted!")
            loadLinks()
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete link")
        }
    }

    async function handleToggleActive(id: string, isActive: boolean) {
        try {
            await toggleQuickLinkActive(id, !isActive)
            loadLinks()
            toast.success(isActive ? "Link hidden" : "Link activated")
        } catch (error) {
            console.error(error)
            toast.error("Failed to update link")
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        )
    }

    // Group links by category
    const linksByCategory = links.reduce((acc, link) => {
        if (!acc[link.category]) acc[link.category] = []
        acc[link.category].push(link)
        return acc
    }, {} as Record<string, QuickLink[]>)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-amber-900">Quick Links</h2>
                    <p className="text-sm text-amber-700">Manage recovery resource links</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleNew} className="bg-amber-600 hover:bg-amber-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Link
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingLink ? "Edit Link" : "Add New Link"}</DialogTitle>
                            <DialogDescription>
                                {editingLink ? "Update link information" : "Add a new recovery resource link"}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="AA.org"
                                />
                            </div>
                            <div>
                                <Label htmlFor="url">URL *</Label>
                                <Input
                                    id="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="https://www.aa.org"
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Official AA website"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <Label htmlFor="category">Category *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="order">Order (within category)</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
                                {editingLink ? "Update" : "Add"} Link
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Links by category */}
            <div className="space-y-6">
                {CATEGORIES.map((category) => {
                    const categoryLinks = linksByCategory[category.value] || []
                    if (categoryLinks.length === 0) return null

                    return (
                        <div key={category.value} className="border border-amber-200 rounded-lg p-4 bg-amber-50/30">
                            <h3 className="font-semibold text-amber-900 mb-3">{category.label} ({categoryLinks.length})</h3>
                            <div className="space-y-2">
                                {categoryLinks.map((link) => (
                                    <div
                                        key={link.id}
                                        className={`flex items-center justify-between p-3 bg-white border border-amber-100 rounded-lg ${!link.isActive ? "opacity-50" : ""
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-amber-900">{link.title}</h4>
                                                {!link.isActive && (
                                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                                        Hidden
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-amber-700/70">{link.description}</p>
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                            >
                                                {link.url}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleToggleActive(link.id, link.isActive)}
                                            >
                                                {link.isActive ? (
                                                    <Eye className="w-4 h-4" />
                                                ) : (
                                                    <EyeOff className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(link)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(link.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
