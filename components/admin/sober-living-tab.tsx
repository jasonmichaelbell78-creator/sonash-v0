"use client"

/**
 * Sober Living Tab - Migrated to use generic AdminCrudTable
 */

import { AdminCrudTable } from "./admin-crud-table"
import { AdminCrudConfig } from "./admin-crud-types"
import { SoberLivingHome, SoberLivingService } from "@/lib/db/sober-living"
import { INITIAL_SOBER_LIVING_HOMES } from "@/scripts/seed-sober-living-data"
import { MapPin, Phone, Globe, Home as HomeIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Sober Living Form component
function SoberLivingForm({
    formData,
    setFormData
}: {
    formData: Partial<SoberLivingHome>
    setFormData: (data: Partial<SoberLivingHome>) => void
    isEditing: boolean
}) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-700">Name</Label>
                <Input name="name" value={formData.name || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="Home Name" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-700">Gender</Label>
                <div className="col-span-3">
                    <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as "Men" | "Women" })}
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="" disabled>Select gender</option>
                        <option value="Men">Men Only</option>
                        <option value="Women">Women Only</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-700">Address</Label>
                <Input name="address" value={formData.address || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="Street Address" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-700">Neighborhood</Label>
                <Input name="neighborhood" value={formData.neighborhood || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="e.g. East Nashville" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-700">Phone</Label>
                <Input name="phone" value={formData.phone || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="(615) ..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-700">Website</Label>
                <Input name="website" value={formData.website || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-700">Image URL</Label>
                <Input name="heroImage" value={formData.heroImage || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-700">Notes</Label>
                <Textarea name="notes" value={formData.notes || ''} onChange={handleChange} className="col-span-3 bg-white" placeholder="Cost, amenities, etc." />
            </div>
        </div>
    )
}

// Adapter to make SoberLivingService match CrudService interface
const soberLivingServiceAdapter = {
    getAll: () => SoberLivingService.getAllHomes(),
    add: (data: Omit<SoberLivingHome, 'id'>) => SoberLivingService.addHome(data).then(() => { }),
    update: (id: string, data: Partial<SoberLivingHome>) => SoberLivingService.updateHome(id, data),
    delete: (id: string) => SoberLivingService.deleteHome(id),
}

// Configuration for sober living homes
const soberLivingConfig: AdminCrudConfig<SoberLivingHome> = {
    entityName: "Sober Living Home",
    entityNamePlural: "Sober Living Homes",

    // Use adapted Firestore service
    service: soberLivingServiceAdapter,

    // Table columns
    columns: [
        {
            key: "gender",
            label: "Gender",
            render: (home) => (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${home.gender === 'Men' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                    home.gender === 'Women' ? 'border-pink-200 bg-pink-50 text-pink-700' :
                        'border-purple-200 bg-purple-50 text-purple-700'
                    }`}>
                    {home.gender === 'Men' ? 'M' : home.gender === 'Women' ? 'W' : 'C'}
                </div>
            )
        },
        {
            key: "name",
            label: "Name",
            render: (home) => (
                <div>
                    <h3 className="font-semibold text-gray-900">{home.name}</h3>
                    {home.neighborhood && (
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 border border-gray-200 px-1.5 rounded-sm">
                            {home.neighborhood}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: "address",
            label: "Details",
            render: (home) => (
                <div className="space-y-0.5 text-sm text-gray-600">
                    <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 opacity-60" /> {home.address}
                    </p>
                    {home.phone && (
                        <p className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 opacity-60" /> {home.phone}
                        </p>
                    )}
                    {home.website && (
                        <a href={home.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline w-fit">
                            <Globe className="w-3.5 h-3.5 opacity-60" /> Website
                        </a>
                    )}
                </div>
            )
        },
    ],

    // Search fields
    searchFields: ["name", "address", "neighborhood"],

    // Form component
    FormComponent: SoberLivingForm,

    // Empty form data
    emptyFormData: {
        name: "",
        gender: "Men",
        address: "",
        neighborhood: "",
        phone: "",
        website: "",
    },

    // Reset functionality
    showResetButton: true,
    resetData: async () => {
        await SoberLivingService.seedInitialHomes(INITIAL_SOBER_LIVING_HOMES)
    },

    // Validation
    validateForm: (data) => {
        if (!data.name) return "Name is required"
        if (!data.address) return "Address is required"
        if (!data.gender) return "Gender is required"
        return null
    },
}

export function SoberLivingTab() {
    return <AdminCrudTable config={soberLivingConfig} />
}
