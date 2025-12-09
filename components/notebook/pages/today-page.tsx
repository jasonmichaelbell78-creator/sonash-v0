"use client"

import { useState } from "react"

interface TodayPageProps {
  nickname: string
}

export default function TodayPage({ nickname }: TodayPageProps) {
  const [mood, setMood] = useState<string | null>(null)
  const [cravings, setCravings] = useState(false)
  const [used, setUsed] = useState(false)
  const [selectedReading, setSelectedReading] = useState<"AA" | "NA">("AA")

  const today = new Date()
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })

  const moods = [
    { id: "struggling", emoji: "😟", label: "Struggling", color: "text-red-500" },
    { id: "okay", emoji: "😐", label: "Okay", color: "text-orange-500" },
    { id: "hopeful", emoji: "🙂", label: "Hopeful", color: "text-lime-500" },
    { id: "great", emoji: "😊", label: "Great", color: "text-green-500" },
  ]

  return (
    <div className="h-full overflow-y-auto pr-2">
      {/* Header */}
      <div className="mb-6">
        <p className="font-body text-lg text-amber-900/80 underline">
          {dateString} – Hey {nickname}, one day at a time.
        </p>
      </div>

      {/* Two column layout for larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Clean time tracker */}
          <div>
            <h2 className="font-heading text-xl text-amber-900/90 mb-2">Tracker – Clean time</h2>
            <p className="font-heading text-2xl md:text-3xl text-amber-900">1 year · 2 months · 5 days</p>
            <p className="font-body text-sm text-amber-900/60 mt-1">... and 13 minutes so far today</p>
            <p className="font-body text-sm text-amber-900/50 mt-2 flex items-center gap-1">
              <span className="inline-block rotate-45">↑</span>
              Tap here if something happened today
            </p>
          </div>

          {/* Today's reading */}
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h2 className="font-heading text-xl text-amber-900/90">Today's Reading</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedReading("AA")}
                  className={`px-3 py-1 rounded-full font-body text-sm transition-all ${
                    selectedReading === "AA" ? "bg-sky-300 text-sky-900" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  AA
                </button>
                <button
                  onClick={() => setSelectedReading("NA")}
                  className={`px-3 py-1 rounded-full font-body text-sm transition-all ${
                    selectedReading === "NA" ? "bg-amber-400 text-amber-900" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  NA
                </button>
              </div>
            </div>

            {/* Sticky note style reading card */}
            <div
              className="bg-amber-100 p-4 rounded-sm relative"
              style={{
                boxShadow: "2px 2px 8px rgba(0,0,0,0.15)",
                transform: "rotate(-1deg)",
              }}
            >
              <p className="font-heading text-lg text-amber-900 text-center mb-3">Serenity is found in the moment.</p>
              <button className="block mx-auto bg-amber-200 hover:bg-amber-300 px-4 py-2 rounded font-body text-amber-900 text-sm transition-colors">
                Open full reading
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Check-in */}
          <div>
            <h2 className="font-heading text-xl text-amber-900/90 mb-3">Check-In: How are you doing today?</h2>
            <div className="flex justify-between gap-2 mb-4">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                    mood === m.id ? "bg-amber-100 scale-110" : "hover:bg-amber-50"
                  }`}
                >
                  <span className="text-2xl md:text-3xl">{m.emoji}</span>
                  <span className="font-body text-xs text-amber-900/70 mt-1">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Toggle questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading text-lg text-amber-900/80">Cravings?</span>
                <div className="flex items-center gap-2">
                  <span className="font-body text-amber-900/60">Yes / No</span>
                  <button
                    onClick={() => setCravings(!cravings)}
                    className={`w-12 h-6 rounded-full transition-colors ${cravings ? "bg-amber-400" : "bg-gray-300"}`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        cravings ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-heading text-lg text-amber-900/80">Used?</span>
                <div className="flex items-center gap-2">
                  <span className="font-body text-amber-900/60">Yes / No</span>
                  <button
                    onClick={() => setUsed(!used)}
                    className={`w-12 h-6 rounded-full transition-colors ${used ? "bg-red-400" : "bg-gray-300"}`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        used ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Journal prompt */}
          <div>
            <h2 className="font-heading text-lg text-amber-900/90 mb-2">Anything you want to jot down?</h2>
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-6 border-b border-amber-200/50" />
              ))}
            </div>
          </div>

          {/* Navigation hint */}
          <p className="font-body text-sm text-amber-900/50 text-right">Swipe left to go to the next section →</p>
        </div>
      </div>
    </div>
  )
}
