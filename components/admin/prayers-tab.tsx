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
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import {
    getAllPrayers,
    addPrayer,
    updatePrayer,
    deletePrayer,
    togglePrayerActive,
    type Prayer,
    type PrayerInput
} from "@/lib/db/library"

const CATEGORIES = [
    { value: "morning", label: "Morning" },
    { value: "evening", label: "Evening" },
    { value: "step", label: "Step Prayer" },
    { value: "meditation", label: "Meditation" }
] as const

export default function PrayersTab() {
    const [prayers, setPrayers] = useState<Prayer[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null)
    const [formData, setFormData] = useState<PrayerInput>({
        title: "",
        text: "",
        category: "morning",
        order: 0,
        isActive: true
    })

    async function loadPrayers() {
        setLoading(true)
        const data = await getAllPrayers(true) // Include inactive
        setPrayers(data)
        setLoading(false)
    }

    useEffect(() => {
        loadPrayers()
    }, [])

    function handleEdit(prayer: Prayer) {
        setEditingPrayer(prayer)
        setFormData({
            title: prayer.title,
            text: prayer.text,
            category: prayer.category,
            order: prayer.order,
            isActive: prayer.isActive
        })
        setDialogOpen(true)
    }

    function handleNew() {
        setEditingPrayer(null)
        setFormData({
            title: "",
            text: "",
            category: "morning",
            order: 0,
            isActive: true
        })
        setDialogOpen(true)
    }

    async function handleSave() {
        if (!formData.title || !formData.text) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            if (editingPrayer) {
                await updatePrayer(editingPrayer.id, formData)
                toast.success("Prayer updated!")
            } else {
                await addPrayer(formData)
                toast.success("Prayer added!")
            }
            setDialogOpen(false)
            loadPrayers()
        } catch (error) {
            console.error(error)
            toast.error("Failed to save prayer")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this prayer?")) return

        try {
            await deletePrayer(id)
            toast.success("Prayer deleted!")
            loadPrayers()
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete prayer")
        }
    }

    async function handleToggleActive(id: string, isActive: boolean) {
        try {
            await togglePrayerActive(id, !isActive)
            loadPrayers()
            toast.success(isActive ? "Prayer hidden" : "Prayer activated")
        } catch (error) {
            console.error(error)
            toast.error("Failed to update prayer")
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        )
    }

    // Group prayers by category
    const prayersByCategory = prayers.reduce((acc, prayer) => {
        if (!acc[prayer.category]) acc[prayer.category] = []
        acc[prayer.category].push(prayer)
        return acc
    }, {} as Record<string, Prayer[]>)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-amber-900">Prayers</h2>
                    <p className="text-sm text-amber-700">Manage recovery prayers and meditations</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleNew} className="bg-amber-600 hover:bg-amber-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Prayer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingPrayer ? "Edit Prayer" : "Add New Prayer"}</DialogTitle>
                            <DialogDescription>
                                {editingPrayer ? "Update prayer content" : "Add a new prayer or meditation"}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Serenity Prayer"
                                />
                            </div>
                            <div>
                                <Label htmlFor="text">Prayer Text *</Label>
                                <Textarea
                                    id="text"
                                    value={formData.text}
                                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                    placeholder="Enter the full prayer text..."
                                    rows={8}
                                    className="font-handlee"
                                />
                            </div>
                            <div>
                                <Label htmlFor="category">Category *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value as Prayer['category'] })}
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
                                {editingPrayer ? "Update" : "Add"} Prayer
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Prayers by category */}
            <div className="space-y-6">
                {CATEGORIES.map((category) => {
                    const categoryPrayers = prayersByCategory[category.value] || []
                    if (categoryPrayers.length === 0) return null

                    return (
                        <div key={category.value} className="border border-purple-200 rounded-lg p-4 bg-purple-50/30">
                            <h3 className="font-semibold text-purple-900 mb-3">{category.label} ({categoryPrayers.length})</h3>
                            <div className="space-y-3">
                                {categoryPrayers.map((prayer) => (
                                    <div
                                        key={prayer.id}
                                        className={`p-4 bg-white border border-purple-100 rounded-lg ${!prayer.isActive ? "opacity-50" : ""
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-purple-900">{prayer.title}</h4>
                                                {!prayer.isActive && (
                                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                                        Hidden
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleToggleActive(prayer.id, prayer.isActive)}
                                                >
                                                    {prayer.isActive ? (
                                                        <Eye className="w-4 h-4" />
                                                    ) : (
                                                        <EyeOff className="w-4 h-4" />
                                                    )}
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleEdit(prayer)}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(prayer.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-purple-800/80 font-handlee leading-relaxed line-clamp-3">
                                            {prayer.text}
                                        </p>
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
