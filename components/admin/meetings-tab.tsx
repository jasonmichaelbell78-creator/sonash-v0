"use client"

/**
 * Meetings Tab - Admin CRUD for meetings collection
 * 
 * Features:
 * - List all meetings with search/filter
 * - Add new meeting
 * - Edit existing meeting
 * - Delete meeting with confirmation
 */

import { useState, useEffect } from "react"
import {
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    query,
    orderBy
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Meeting } from "@/lib/db/meetings"

type ModalMode = "closed" | "add" | "edit"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const
const TYPES = ["AA", "NA", "CA", "Smart", "Al-Anon"] as const

const emptyMeeting: Omit<Meeting, "id"> = {
    name: "",
    type: "AA",
    day: "Monday",
    time: "19:00",
    address: "",
    neighborhood: "",
}

export function MeetingsTab() {
    const [meetings, setMeetings] = useState<Meeting[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [dayFilter, setDayFilter] = useState<string>("all")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [timeFilter, setTimeFilter] = useState<string>("all")

    // Modal state
    const [modalMode, setModalMode] = useState<ModalMode>("closed")
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
    const [formData, setFormData] = useState<Omit<Meeting, "id">>(emptyMeeting)
    const [saving, setSaving] = useState(false)

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // Fetch meetings
    useEffect(() => {
        fetchMeetings()
    }, [])

    const fetchMeetings = async () => {
        setLoading(true)
        try {
            const meetingsRef = collection(db, "meetings")
            // Fetch all, sort client-side to avoid needing composite index
            const snapshot = await getDocs(meetingsRef)
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Meeting))
            // Sort by day then time client-side
            const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            data.sort((a, b) => {
                const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
                if (dayDiff !== 0) return dayDiff
                return a.time.localeCompare(b.time)
            })
            setMeetings(data)
        } catch (error) {
            console.error("Error fetching meetings:", error)
        }
        setLoading(false)
    }

    // Filter meetings
    const filteredMeetings = meetings.filter(m => {
        const matchesSearch =
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.address.toLowerCase().includes(search.toLowerCase()) ||
            m.neighborhood.toLowerCase().includes(search.toLowerCase())
        const matchesDay = dayFilter === "all" || m.day === dayFilter
        const matchesType = typeFilter === "all" || m.type === typeFilter
        const matchesTime = timeFilter === "all" || getTimeSlot(m.time) === timeFilter
        return matchesSearch && matchesDay && matchesType && matchesTime
    })

    // Helper to categorize time into slots
    function getTimeSlot(time: string): string {
        const hour = parseInt(time.split(":")[0], 10)
        if (hour < 12) return "morning"
        if (hour < 17) return "afternoon"
        return "evening"
    }

    // Open add modal
    const handleAdd = () => {
        setFormData(emptyMeeting)
        setEditingMeeting(null)
        setModalMode("add")
    }

    // Open edit modal
    const handleEdit = (meeting: Meeting) => {
        setFormData({
            name: meeting.name,
            type: meeting.type,
            day: meeting.day,
            time: meeting.time,
            address: meeting.address,
            neighborhood: meeting.neighborhood,
        })
        setEditingMeeting(meeting)
        setModalMode("edit")
    }

    // Save meeting (add or update)
    const handleSave = async () => {
        setSaving(true)
        try {
            const id = editingMeeting?.id || `meeting_${Date.now()}`
            await setDoc(doc(db, "meetings", id), {
                id,
                ...formData,
            })
            await fetchMeetings()
            setModalMode("closed")
        } catch (error) {
            console.error("Error saving meeting:", error)
            alert("Failed to save meeting")
        }
        setSaving(false)
    }

    // Delete meeting
    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await deleteDoc(doc(db, "meetings", deleteId))
            await fetchMeetings()
            setDeleteId(null)
        } catch (error) {
            console.error("Error deleting meeting:", error)
            alert("Failed to delete meeting")
        }
    }

    if (loading) {
        return (
            <div className="text-center py-12 text-gray-500">
                Loading meetings...
            </div>
        )
    }

    return (
        <div>
            {/* Header with search and add */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Search meetings..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 w-64"
                    />
                    <select
                        value={dayFilter}
                        onChange={(e) => setDayFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2"
                    >
                        <option value="all">All Days</option>
                        {DAYS.map(day => (
                            <option key={day} value={day}>{day}</option>
                        ))}
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2"
                    >
                        <option value="all">All Types</option>
                        {TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2"
                    >
                        <option value="all">All Times</option>
                        <option value="morning">Morning (before 12pm)</option>
                        <option value="afternoon">Afternoon (12-5pm)</option>
                        <option value="evening">Evening (after 5pm)</option>
                    </select>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    + Add Meeting
                </button>
            </div>

            {/* Count */}
            <div className="text-sm text-gray-500 mb-4">
                Showing {filteredMeetings.length} of {meetings.length} meetings
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Type</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Day</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Time</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Address</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Neighborhood</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMeetings.map((meeting) => (
                            <tr key={meeting.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm">{meeting.name}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${meeting.type === "AA" ? "bg-blue-100 text-blue-700" :
                                        meeting.type === "NA" ? "bg-green-100 text-green-700" :
                                            meeting.type === "CA" ? "bg-purple-100 text-purple-700" :
                                                "bg-gray-100 text-gray-700"
                                        }`}>
                                        {meeting.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm">{meeting.day}</td>
                                <td className="px-4 py-3 text-sm">{meeting.time}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{meeting.address}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{meeting.neighborhood}</td>
                                <td className="px-4 py-3 text-sm text-right">
                                    <button
                                        onClick={() => handleEdit(meeting)}
                                        className="text-blue-600 hover:underline mr-3"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(meeting.id)}
                                        className="text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredMeetings.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No meetings found
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {modalMode !== "closed" && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">
                                {modalMode === "add" ? "Add Meeting" : "Edit Meeting"}
                            </h2>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Meeting name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={formData.type}
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
                                        value={formData.day}
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
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Full address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
                                <input
                                    type="text"
                                    value={formData.neighborhood}
                                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="e.g., East Nashville"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setModalMode("closed")}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formData.name || !formData.address}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
                        <h2 className="text-lg font-semibold mb-2">Delete Meeting?</h2>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete this meeting? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
