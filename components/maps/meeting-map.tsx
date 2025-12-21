"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Meeting } from "@/lib/db/meetings"

// Fix Leaflet default icon not found
const fixLeafletIcon = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    })
}

// Map Controller to handle view updates
function MapController({ center, meetings }: { center: { lat: number; lng: number } | null, meetings: Meeting[] }) {
    const map = useMap()

    useEffect(() => {
        if (!map) return

        // If we have meetings, fit bounds to them
        if (meetings.length > 0) {
            const _bounds = L.latLngBounds(meetings.map(m => [m.coordinates?.lat || 0, m.coordinates?.lng || 0]))

            // Filter out 0/0 coordinates
            const validPoints = meetings
                .filter(m => m.coordinates && m.coordinates.lat !== 0)
                .map(m => L.latLng(m.coordinates!.lat, m.coordinates!.lng))

            if (validPoints.length > 0) {
                const bounds = L.latLngBounds(validPoints)
                // Add user location if available
                if (center) {
                    bounds.extend(center)
                }
                map.fitBounds(bounds, { padding: [50, 50] })
            } else if (center) {
                map.setView(center, 13)
            }
        } else if (center) {
            map.setView(center, 13)
        }
    }, [map, center, meetings])

    return null
}

// Custom User Icon (Red)
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MeetingMapProps {
    meetings: Meeting[]
    userLocation: { lat: number; lng: number } | null
}

export default function MeetingMap({ meetings, userLocation }: MeetingMapProps) {
    useEffect(() => {
        fixLeafletIcon()
    }, [])

    // Default center (Nashville)
    const defaultCenter = { lat: 36.1627, lng: -86.7816 }
    const center = userLocation || defaultCenter

    const validMeetings = useMemo(() =>
        meetings.filter(m => m.coordinates && m.coordinates.lat !== 0 && m.coordinates.lng !== 0)
        , [meetings])

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden border border-amber-200 z-0 relative">
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController center={userLocation} meetings={validMeetings} />

                {/* User Location Marker (Red with Circle) */}
                {userLocation && (
                    <Circle
                        center={[userLocation.lat, userLocation.lng]}
                        radius={500}
                        pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1 }}
                    >
                        <Marker
                            position={[userLocation.lat, userLocation.lng]}
                            icon={userIcon}
                        >
                            <Popup>You are here</Popup>
                        </Marker>
                    </Circle>
                )}

                {/* Meeting Markers */}
                {validMeetings.map((meeting) => (
                    <Marker
                        key={meeting.id}
                        position={[meeting.coordinates!.lat, meeting.coordinates!.lng]}
                    >
                        <Popup>
                            <div className="p-1 min-w-[200px]">
                                <h3 className="font-bold text-gray-900 mb-1">{meeting.name}</h3>
                                <div className="text-xs text-gray-600 mb-2">
                                    <p>{meeting.day} • {meeting.time}</p>
                                    <p>{meeting.address}</p>
                                </div>
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${meeting.coordinates!.lat},${meeting.coordinates!.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full text-center bg-blue-500 text-white text-xs py-1.5 rounded hover:bg-blue-600 transition-colors"
                                >
                                    Get Directions
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}
