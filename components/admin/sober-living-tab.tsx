"use client"

import { useState, useEffect } from "react"
import { SoberLivingHome, SoberLivingService } from "@/lib/db/sober-living"
import { INITIAL_SOBER_LIVING_HOMES } from "@/scripts/seed-sober-living-data"
import { Plus, Search, Pencil, Trash2, MapPin, Phone, Globe, Loader2, Home, RotateCcw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function SoberLivingTab() {
    const [homes, setHomes] = useState<SoberLivingHome[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [currentHome, setCurrentHome] = useState<SoberLivingHome | null>(null)
    const [formData, setFormData] = useState<Partial<SoberLivingHome>>({})
    const [saving, setSaving] = useState(false)
    const [resetting, setResetting] = useState(false)

    useEffect(() => {
        loadHomes()
    }, [])

    const loadHomes = async () => {
        setLoading(true)
        try {
            const data = await SoberLivingService.getAllHomes()
            setHomes(data)
        } catch (error) {
            console.error("Failed to load homes:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleResetData = async () => {
        if (!confirm("Start Fresh? Distructive Action.\n\nThis will DELETE ALL current sober living homes and replace them with the imported TNARR list.")) return

        setResetting(true)
        try {
            await SoberLivingService.seedInitialHomes(INITIAL_SOBER_LIVING_HOMES)
            await loadHomes()
        } catch (e) {
            console.error(e)
            alert("Failed to reset data")
        } finally {
            setResetting(false)
        }
    }

    const handleAdd = async () => {
        setSaving(true)
        try {
            await SoberLivingService.addHome(formData as SoberLivingHome)
            await loadHomes()
            setIsAddOpen(false)
            setFormData({})
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = async () => {
        if (!currentHome) return
        setSaving(true)
        try {
            await SoberLivingService.updateHome(currentHome.id, formData)
            await loadHomes()
            setIsEditOpen(false)
            setCurrentHome(null)
            setFormData({})
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this home?")) return
        try {
            await SoberLivingService.deleteHome(id)
            setHomes(homes.filter(h => h.id !== id))
        } catch (error) {
            console.error(error)
        }
    }

    const openEdit = (home: SoberLivingHome) => {
        setCurrentHome(home)
        setFormData(home)
        setIsEditOpen(true)
    }

    const filteredHomes = homes.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-4">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative flex-1 w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-900/40" />
                    <input
                        type="text"
                        placeholder="Search homes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 rounded-md border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetData}
                        disabled={resetting}
                        className="flex-1 sm:flex-none border-amber-200 text-amber-900 hover:bg-amber-100"
                    >
                        {resetting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <RotateCcw className="w-3 h-3 mr-2 text-amber-600" />}
                        Reset / Import
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white">
                                <Plus className="w-4 h-4 mr-1.5" /> Add Home
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg bg-[#fdfbf7] border-amber-200">
                            <DialogHeader>
                                <DialogTitle className="text-amber-900">Add Sober Living Home</DialogTitle>
                            </DialogHeader>
                            <HomeForm formData={formData} setFormData={setFormData} />
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button onClick={handleAdd} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
                                    {saving && <Loader2 className="w-3 h-3 animate-spin mr-2" />} Save
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg border border-amber-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-amber-900/40 italic">Loading...</div>
                ) : filteredHomes.length === 0 ? (
                    <div className="p-8 text-center text-amber-900/40 italic">
                        No sober living homes found. Click "Reset / Import" to seed data from TNARR.
                    </div>
                ) : (
                    <div className="divide-y divide-amber-100">
                        {filteredHomes.map((home) => (
                            <div key={home.id} className="p-4 flex items-start gap-4 hover:bg-amber-50/50 transition-colors group">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 
                  ${home.gender === 'Men' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                        home.gender === 'Women' ? 'border-pink-200 bg-pink-50 text-pink-700' :
                                            'border-purple-200 bg-purple-50 text-purple-700'}`}>
                                    {home.gender === 'Men' ? 'M' : home.gender === 'Women' ? 'W' : 'C'}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-heading text-base text-amber-900 font-semibold truncate">{home.name}</h3>
                                        {home.neighborhood && (
                                            <span className="text-[10px] uppercase tracking-wider font-medium text-amber-900/40 border border-amber-100 px-1.5 rounded-sm">
                                                {home.neighborhood}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm text-amber-900/70 flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 opacity-60" /> {home.address}
                                        </p>
                                        {home.phone && (
                                            <p className="text-sm text-amber-900/70 flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 opacity-60" /> {home.phone}
                                            </p>
                                        )}
                                        {home.website && (
                                            <a href={home.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1.5 w-fit">
                                                <Globe className="w-3.5 h-3.5 opacity-60" /> Website
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-900" onClick={() => openEdit(home)}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-red-600" onClick={() => handleDelete(home.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-lg bg-[#fdfbf7] border-amber-200">
                    <DialogHeader>
                        <DialogTitle className="text-amber-900">Edit Sober Living Home</DialogTitle>
                    </DialogHeader>
                    <HomeForm formData={formData} setFormData={setFormData} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleEdit} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
                            {saving && <Loader2 className="w-3 h-3 animate-spin mr-2" />} Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function HomeForm({ formData, setFormData }: { formData: Partial<SoberLivingHome>, setFormData: (d: Partial<SoberLivingHome>) => void }) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelect = (val: string) => {
        setFormData({ ...formData, gender: val as "Men" | "Women" })
    }

    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-amber-900/70">Name</Label>
                <Input name="name" value={formData.name || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="Home Name" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-amber-900/70">Gender</Label>
                <div className="col-span-3">
                    <select
                        value={formData.gender}
                        onChange={(e) => handleSelect(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="" disabled>Select gender</option>
                        <option value="Men">Men Only</option>
                        <option value="Women">Women Only</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-amber-900/70">Address</Label>
                <Input name="address" value={formData.address || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="Street Address" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-amber-900/70">Neighborhood</Label>
                <Input name="neighborhood" value={formData.neighborhood || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="e.g. East Nashville" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-amber-900/70">Phone</Label>
                <Input name="phone" value={formData.phone || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="(615) ..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-amber-900/70">Website</Label>
                <Input name="website" value={formData.website || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-amber-900/70">Image URL</Label>
                <Input name="heroImage" value={formData.heroImage || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-amber-900/70">Notes</Label>
                <Textarea name="notes" value={formData.notes || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="Cost, amenities, etc." />
            </div>
        </div>
    )
}
