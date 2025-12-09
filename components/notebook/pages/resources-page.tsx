"use client"

import { MapPin, Home, Map, Calendar } from "lucide-react"

export default function ResourcesPage() {
  const resources = [
    {
      icon: MapPin,
      title: "Meeting Finder",
      description: "Find AA, NA, and support meetings by time and neighborhood.",
    },
    {
      icon: Home,
      title: "Sober Living Finder",
      description: "Sober homes and halfway houses with basic info and contacts.",
    },
    {
      icon: Map,
      title: "Local Resource Map",
      description: "Detox, rehabs, clinics, pharmacies, food, IDs, bus stations.",
    },
    {
      icon: Calendar,
      title: "Nashville Sober Events",
      description: "Cookouts, game nights, sober concerts and more.",
    },
  ]

  const meetings = [
    { time: "7:00 am", type: "AA", location: "East Nashville" },
    { time: "12:00 pm", type: "NA", location: "Downtown" },
    { time: "6:30 pm", type: "AA", location: "West End" },
  ]

  return (
    <div className="h-full overflow-y-auto pr-2">
      <h1 className="font-heading text-2xl text-amber-900 underline mb-4">Resources – Getting around Nashville</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Resource cards */}
        <div className="space-y-3">
          {resources.map((resource, index) => (
            <button
              key={index}
              className="w-full text-left p-4 border border-amber-200/50 rounded-lg hover:bg-amber-50 transition-colors group"
              style={{ boxShadow: "1px 1px 4px rgba(0,0,0,0.05)" }}
            >
              <div className="flex items-start gap-3">
                <resource.icon className="w-6 h-6 text-amber-700/70 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-heading text-lg text-amber-900 group-hover:underline">{resource.title}</h3>
                  <p className="font-body text-sm text-amber-900/60">{resource.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right column - Meeting finder today */}
        <div>
          <h2 className="font-heading text-xl text-amber-900 mb-4">Meeting Finder – Today</h2>

          {/* Hand-drawn map placeholder */}
          <div
            className="relative w-full h-40 mb-4 rounded-lg overflow-hidden border border-amber-200/50"
            style={{
              background: "linear-gradient(135deg, #f5f0e6 0%, #ebe5d9 100%)",
            }}
          >
            {/* Stylized map lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
              {/* Roads */}
              <path
                d="M20,50 Q60,30 100,50 T180,50"
                stroke="#9ca3af"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4,2"
              />
              <path d="M50,20 Q70,50 50,80" stroke="#9ca3af" strokeWidth="2" fill="none" strokeDasharray="4,2" />
              <path d="M100,10 L100,90" stroke="#9ca3af" strokeWidth="1.5" fill="none" strokeDasharray="3,2" />
              <path d="M150,30 Q130,50 150,70" stroke="#9ca3af" strokeWidth="2" fill="none" strokeDasharray="4,2" />

              {/* River */}
              <path d="M0,60 Q50,70 100,55 T200,65" stroke="#93c5fd" strokeWidth="4" fill="none" opacity="0.6" />
            </svg>

            {/* Map pins */}
            <div className="absolute top-6 left-16">
              <MapPin className="w-5 h-5 text-amber-600 fill-amber-200" />
            </div>
            <div className="absolute top-12 left-1/2 -translate-x-1/2">
              <MapPin className="w-5 h-5 text-amber-600 fill-amber-200" />
            </div>
            <div className="absolute bottom-8 right-16">
              <MapPin className="w-5 h-5 text-amber-600 fill-amber-200" />
            </div>

            {/* Click overlay */}
            <button className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/5 transition-colors">
              <span className="sr-only">Open full map</span>
            </button>
          </div>

          {/* Meeting list */}
          <div className="space-y-2">
            {meetings.map((meeting, index) => (
              <button
                key={index}
                className="w-full text-left flex items-center gap-3 p-2 hover:bg-amber-50 rounded transition-colors"
              >
                <div className="w-4 h-4 border-2 border-amber-400 rounded-sm" />
                <span className="font-body text-amber-900">
                  {meeting.time} – {meeting.type} – {meeting.location}
                </span>
              </button>
            ))}
          </div>

          <p className="font-body text-sm text-amber-900/50 mt-4 italic">Tap a meeting for details or directions.</p>
        </div>
      </div>
    </div>
  )
}
