"use client"

/**
 * Meetings Tab - Migrated to use generic AdminCrudTable
 */

import { AdminCrudTable } from "./admin-crud-table"
import { AdminCrudConfig } from "./admin-crud-types"
import { Meeting } from "@/lib/db/meetings"
import { MeetingsService } from "@/lib/db/meetings"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const
const TYPES = ["AA", "NA", "CA", "Smart", "Al-Anon"] as const

// Meeting form component
function MeetingForm({
    formData,
    setFormData,
    _isEditing
}: {
    formData: Partial<Meeting>
    setFormData: (data: Partial<Meeting>) => void
    _isEditing?: boolean
}) {
    return (
        <div className="space-y-4 py-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Meeting name"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                        value={formData.type || "AA"}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Meeting["type"] })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                        {TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                    <select
                        value={formData.day || "Monday"}
                        onChange={(e) => setFormData({ ...formData, day: e.target.value as Meeting["day"] })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                        {DAYS.map(day => (
                            <option key={day} value={day}>{day}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time (24h format)</label>
                <input
                    type="time"
                    value={formData.time || "19:00"}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Full address"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
                <input
                    type="text"
                    value={formData.neighborhood || ""}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., East Nashville"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                        type="number"
                        step="any"
                        value={formData.coordinates?.lat || ""}
                        onChange={(e) => {
                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value)
                            setFormData({
                                ...formData,
                                coordinates: {
                                    lat: val,
                                    lng: formData.coordinates?.lng || 0
                                }
                            })
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="36.1627"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                        type="number"
                        step="any"
                        value={formData.coordinates?.lng || ""}
                        onChange={(e) => {
                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value)
                            setFormData({
                                ...formData,
                                coordinates: {
                                    lat: formData.coordinates?.lat || 0,
                                    lng: val
                                }
                            })
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="-86.7816"
                    />
                </div>
            </div>
        </div>
    )
}

// Time slot helper
function getTimeSlot(time: string): string {
    const hour = parseInt(time.split(":")[0], 10)
    if (hour < 12) return "morning"
    if (hour < 17) return "afternoon"
    return "evening"
}

// Configuration for meetings
const meetingsConfig: AdminCrudConfig<Meeting> = {
    entityName: "Meeting",
    entityNamePlural: "Meetings",

    // Use Cloud Functions (from Phase 1 security fixes)
    cloudFunctions: {
        saveFunctionName: "adminSaveMeeting",
        deleteFunctionName: "adminDeleteMeeting",
    },
    collectionName: "meetings",

    // Table columns
    columns: [
        { key: "name", label: "Name" },
        {
            key: "type",
            label: "Type",
            render: (meeting) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${meeting.type === "AA" ? "bg-blue-100 text-blue-700" :
                    meeting.type === "NA" ? "bg-green-100 text-green-700" :
                        meeting.type === "CA" ? "bg-purple-100 text-purple-700" :
                            "bg-gray-100 text-gray-700"
                    }`}>
                    {meeting.type}
                </span>
            )
        },
        { key: "day", label: "Day" },
        { key: "time", label: "Time" },
        { key: "address", label: "Address", className: "max-w-xs truncate text-gray-600" },
        { key: "neighborhood", label: "Neighborhood", className: "text-gray-600" },
    ],

    // Search fields
    searchFields: ["name", "address", "neighborhood"],

    // Filters
    filters: [
        {
            key: "day",
            label: "Days",
            options: DAYS.map(day => ({ value: day, label: day })),
        },
        {
            key: "type",
            label: "Types",
            options: TYPES.map(type => ({ value: type, label: type })),
        },
        {
            key: "time",
            label: "Times",
            options: [
                { value: "morning", label: "Morning (before 12pm)" },
                { value: "afternoon", label: "Afternoon (12-5pm)" },
                { value: "evening", label: "Evening (after 5pm)" },
            ],
            getValue: (meeting: Meeting) => getTimeSlot(meeting.time),
        },
    ],

    // Form component
    FormComponent: MeetingForm,

    // Empty form data
    emptyFormData: {
        name: "",
        type: "AA",
        day: "Monday",
        time: "19:00",
        address: "",
        neighborhood: "",
    },

    // Reset functionality
    showResetButton: true,
    resetData: async () => {
        await MeetingsService.clearAllMeetings()
        await MeetingsService.seedInitialMeetings()
    },

    // Validation
    validateForm: (data) => {
        if (!data.name) return "Name is required"
        if (!data.address) return "Address is required"
        return null
    },
}

export function MeetingsTab() {
    return <AdminCrudTable config={meetingsConfig} />
}
