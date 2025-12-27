"use client"

import { Meeting } from "@/lib/db/meetings"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { calculateDistance, formatDistance } from "@/lib/utils/distance"

interface MeetingDetailsDialogProps {
  meeting: Meeting | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userLocation?: { lat: number; lng: number } | null
}

export function MeetingDetailsDialog({ meeting, open, onOpenChange, userLocation }: MeetingDetailsDialogProps) {
  if (!meeting) return null

  const getMeetingDistance = (): string | null => {
    if (!userLocation || !meeting.coordinates) return null
    const distance = calculateDistance(userLocation, meeting.coordinates)
    return formatDistance(distance)
  }

  const distance = getMeetingDistance()

  const getFullAddress = () => {
    const parts = [
      meeting.address,
      meeting.city || "Nashville",
      meeting.state || "TN",
      meeting.zip
    ].filter(Boolean)
    return parts.join(", ")
  }

  const fullAddress = getFullAddress()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#fdfbf7] border-amber-200">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-amber-900 flex items-center gap-2 pt-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 ${meeting.type === 'NA' ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-blue-400 text-blue-700 bg-blue-50'}`}>
              {meeting.type}
            </div>
            {meeting.name}
          </DialogTitle>
          <DialogDescription className="text-amber-900/70 text-base">
            {meeting.day}, {meeting.time}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-900 text-sm">Location</h4>
              <p className="text-sm text-amber-800/80">{meeting.address}</p>
              <p className="text-xs text-amber-800/60 mt-0.5">
                {[meeting.city || "Nashville", meeting.state || "TN", meeting.zip].filter(Boolean).join(", ")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">{meeting.neighborhood}</span>
                {distance && (
                  <>
                    <span className="text-amber-300">•</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {distance} away
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full border-amber-200 hover:bg-amber-100 text-amber-800"
              onClick={() => {
                // Use coordinates if available and NOT (0,0)
                const hasValidCoords = meeting.coordinates && (meeting.coordinates.lat !== 0 || meeting.coordinates.lng !== 0)

                const mapsUrl = hasValidCoords && meeting.coordinates
                  ? `https://www.google.com/maps/dir/?api=1&destination=${meeting.coordinates.lat},${meeting.coordinates.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
                window.open(mapsUrl, '_blank')
              }}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
            <Button
              variant="outline"
              className="w-full border-amber-200 hover:bg-amber-100 text-amber-800"
              onClick={() => {
                // Create shareable link with FULL address
                const shareText = `${meeting.name} - ${meeting.day} at ${meeting.time}\n${fullAddress}`
                if (navigator.share) {
                  navigator.share({
                    title: meeting.name,
                    text: shareText,
                  }).catch(() => {
                    // Fallback to clipboard
                    navigator.clipboard.writeText(shareText)
                    toast.success("Meeting info copied to clipboard!")
                  })
                } else {
                  navigator.clipboard.writeText(shareText)
                  toast.success("Meeting info copied to clipboard!")
                }
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
