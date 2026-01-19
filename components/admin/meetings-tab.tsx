"use client";

/**
 * Meetings Tab - Migrated to use generic AdminCrudTable
 */

import { AdminCrudTable } from "./admin-crud-table";
import { AdminCrudConfig } from "./admin-crud-types";
import { Meeting } from "@/lib/db/meetings";
import { MeetingsService } from "@/lib/db/meetings";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
const TYPES = ["AA", "NA", "CA", "Smart", "Al-Anon"] as const;

/**
 * Handle coordinate field updates, clearing the coordinates object when both values are empty
 */
function handleCoordinateChange(
  formData: Partial<Meeting>,
  setFormData: (data: Partial<Meeting>) => void,
  field: "lat" | "lng",
  value: string
): void {
  const parsedValue = value === "" ? undefined : parseFloat(value);
  const otherField = field === "lat" ? "lng" : "lat";
  const otherValue = formData.coordinates?.[otherField];

  // If both cleared (or other is 0 default), remove coordinates object
  if (parsedValue === undefined && (otherValue === undefined || otherValue === 0)) {
    const { coordinates: _coordinates, ...rest } = formData;
    setFormData(rest);
  } else {
    setFormData({
      ...formData,
      coordinates: {
        lat: field === "lat" ? (parsedValue ?? 0) : (formData.coordinates?.lat ?? 0),
        lng: field === "lng" ? (parsedValue ?? 0) : (formData.coordinates?.lng ?? 0),
      },
    });
  }
}

/**
 * External link icon component
 */
function ExternalLinkIcon() {
  return (
    <svg
      className="w-3 h-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

/**
 * Google Maps link component
 */
function GoogleMapsLink({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="flex justify-end pt-1">
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
      >
        <span>View on Google Maps</span>
        <ExternalLinkIcon />
      </a>
    </div>
  );
}

/**
 * Location details section of the meeting form
 */
function LocationDetailsSection({
  formData,
  setFormData,
}: {
  formData: Partial<Meeting>;
  setFormData: (data: Partial<Meeting>) => void;
}) {
  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <h3 className="text-sm font-medium text-gray-900">Location Details</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
        <input
          type="text"
          value={formData.address || ""}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="123 Main St"
        />
      </div>

      <div className="grid grid-cols-6 gap-3">
        <div className="col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            value={formData.city || ""}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input
            type="text"
            value={formData.state || ""}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
          <input
            type="text"
            value={formData.zip || ""}
            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="37209"
          />
        </div>
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
    </div>
  );
}

// Meeting form component
function MeetingForm({
  formData,
  setFormData,
}: {
  formData: Partial<Meeting>;
  setFormData: (data: Partial<Meeting>) => void;
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
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
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
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
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

      <LocationDetailsSection formData={formData} setFormData={setFormData} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={formData.coordinates?.lat ?? ""}
            onChange={(e) => handleCoordinateChange(formData, setFormData, "lat", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="36.1627"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={formData.coordinates?.lng ?? ""}
            onChange={(e) => handleCoordinateChange(formData, setFormData, "lng", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="-86.7816"
          />
        </div>
      </div>

      {/* Dynamic Map Link */}
      {formData.coordinates?.lat != null && formData.coordinates?.lng != null && (
        <GoogleMapsLink lat={formData.coordinates.lat} lng={formData.coordinates.lng} />
      )}
    </div>
  );
}

// Time slot helper
function getTimeSlot(time: string): string {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

// Configuration for meetings
const meetingsConfig: AdminCrudConfig<Meeting> = {
  entityName: "Meeting",
  entityNamePlural: "Meetings",
  tabId: "meetings",

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
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            meeting.type === "AA"
              ? "bg-blue-100 text-blue-700"
              : meeting.type === "NA"
                ? "bg-green-100 text-green-700"
                : meeting.type === "CA"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-700"
          }`}
        >
          {meeting.type}
        </span>
      ),
    },
    { key: "day", label: "Day" },
    { key: "time", label: "Time" },
    {
      key: "address",
      label: "Address",
      className: "max-w-xs truncate text-gray-600",
      render: (meeting) => {
        const parts = [meeting.address, meeting.city, meeting.state].filter(Boolean);
        return <span>{parts.join(", ")}</span>;
      },
    },
    { key: "neighborhood", label: "Neighborhood", className: "text-gray-600" },
  ],

  // Search fields
  searchFields: ["name", "address", "neighborhood", "city"],

  // Filters
  filters: [
    {
      key: "day",
      label: "Days",
      options: DAYS.map((day) => ({ value: day, label: day })),
    },
    {
      key: "type",
      label: "Types",
      options: TYPES.map((type) => ({ value: type, label: type })),
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
    city: "", // Removed default to allow explicit entry
    state: "", // Removed default
    zip: "",
    neighborhood: "",
  },

  // Reset functionality
  showResetButton: true,
  resetData: async () => {
    await MeetingsService.clearAllMeetings();
    await MeetingsService.seedInitialMeetings();
  },

  // Validation
  validateForm: (data) => {
    if (!data.name) return "Name is required";
    if (!data.address) return "Street Address is required";
    if (!data.city) return "City is required";
    return null;
  },
};

export function MeetingsTab() {
  return <AdminCrudTable config={meetingsConfig} />;
}
