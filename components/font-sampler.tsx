"use client"

import { useState } from "react"

const fonts = {
  headers: [
    { name: "Caveat", className: "font-caveat", description: "Casual, slightly slanted, very readable" },
    { name: "Kalam", className: "font-kalam", description: "Warmer, more rounded, friendly feel" },
    { name: "Permanent Marker", className: "font-marker", description: "Bold, marker-style, impactful" },
    { name: "Dancing Script", className: "font-dancing", description: "Elegant flowing cursive" },
    { name: "Satisfy", className: "font-satisfy", description: "Smooth, connected script" },
    { name: "Pacifico", className: "font-pacifico", description: "Retro surf-style, fun" },
    { name: "Amatic SC", className: "font-amatic", description: "Tall, condensed, hand-drawn feel" },
    { name: "Rock Salt", className: "font-rocksalt", description: "Gritty, authentic handwriting" },
    { name: "Gloria Hallelujah", className: "font-gloria", description: "Casual comic-style handwriting" },
  ],
  body: [
    { name: "Architects Daughter", className: "font-architects", description: "Technical but warm" },
    { name: "Coming Soon", className: "font-coming", description: "Casual notebook feel" },
    { name: "Handlee", className: "font-handlee", description: "Natural, everyday handwriting" },
    { name: "Neucha", className: "font-neucha", description: "Casual, slightly slanted" },
    { name: "Short Stack", className: "font-shortstack", description: "Casual, rounded, friendly" },
    { name: "Annie Use Your Telescope", className: "font-annie", description: "Thin, delicate handwriting" },
    { name: "Gochi Hand", className: "font-gochi", description: "Energetic, youthful" },
    { name: "Pangolin", className: "font-pangolin", description: "Rounded, very readable" },
    { name: "La Belle Aurore", className: "font-labelle", description: "Elegant cursive handwriting" },
  ],
}

const sampleTexts = {
  title: "SoNash - Sober Nashville",
  subtitle: "Alex's Recovery Notebook",
  counter: "You've been clean for 37 days.",
  cta: "Turn to Today's Page →",
  heading: "My Support Circle",
  subheading: "The people I reach out to when things get rough.",
  body: "Jordan (Sponsor) - good in a crisis · just to talk",
  note: "Ask about step work. Share how this week went.",
  quote: "Serenity is found in the moment.",
}

export default function FontSampler() {
  const [selectedHeader, setSelectedHeader] = useState("font-caveat")
  const [selectedBody, setSelectedBody] = useState("font-architects")

  return (
    <div className="min-h-screen bg-amber-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-2 text-2xl font-bold text-amber-900 md:text-3xl">Font Sampler for SoNash</h1>
        <p className="mb-8 text-amber-700">
          Click on any font to see it applied in the preview. Compare how each looks with your app&apos;s actual
          content.
        </p>

        <div className="grid gap-8 xl:grid-cols-[1fr_400px]">
          {/* Font Selection */}
          <div className="space-y-8">
            {/* Header Fonts */}
            <div className="rounded-lg border-2 border-amber-200 bg-white p-4 shadow-md md:p-6">
              <h2 className="mb-4 text-lg font-semibold text-amber-900">Header/Title Fonts (9 options)</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fonts.headers.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => setSelectedHeader(font.className)}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      selectedHeader === font.className
                        ? "border-blue-500 bg-blue-50"
                        : "border-amber-100 bg-amber-50 hover:border-amber-300"
                    }`}
                  >
                    <div className={`${font.className} text-xl text-amber-900 md:text-2xl`}>SoNash</div>
                    <div className={`${font.className} mt-1 text-base text-amber-800`}>Recovery Notebook</div>
                    <div className="mt-2 font-sans text-xs text-amber-600">
                      <span className="font-medium">{font.name}</span>
                      <br />
                      {font.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Body Fonts */}
            <div className="rounded-lg border-2 border-amber-200 bg-white p-4 shadow-md md:p-6">
              <h2 className="mb-4 text-lg font-semibold text-amber-900">Body/Note Fonts (9 options)</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fonts.body.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => setSelectedBody(font.className)}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      selectedBody === font.className
                        ? "border-blue-500 bg-blue-50"
                        : "border-amber-100 bg-amber-50 hover:border-amber-300"
                    }`}
                  >
                    <div className={`${font.className} text-lg text-amber-900`}>{sampleTexts.body}</div>
                    <div className="mt-2 font-sans text-xs text-amber-600">
                      <span className="font-medium">{font.name}</span>
                      <br />
                      {font.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview - Sticky on desktop */}
          <div className="xl:sticky xl:top-8 xl:self-start">
            <div className="rounded-lg border-2 border-amber-200 bg-white p-4 shadow-md md:p-6">
              <h2 className="mb-4 text-lg font-semibold text-amber-900">Live Preview</h2>
              <p className="mb-4 text-sm text-amber-600">
                <span className="font-medium">Header:</span> {selectedHeader.replace("font-", "")}
                <br />
                <span className="font-medium">Body:</span> {selectedBody.replace("font-", "")}
              </p>

              {/* Notebook Cover Preview */}
              <div
                className="mb-6 rounded-lg p-6"
                style={{
                  background: "linear-gradient(135deg, #4a7c89 0%, #5d8a94 50%, #4a7c89 100%)",
                  boxShadow: "inset 0 0 30px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.2)",
                }}
              >
                <div className={`${selectedHeader} text-center text-white`}>
                  <div className="text-2xl drop-shadow-md md:text-3xl">{sampleTexts.title}</div>
                  <div className="mt-2 text-lg opacity-90 md:text-xl">{sampleTexts.subtitle}</div>
                  <div className={`${selectedBody} mt-6 text-base opacity-80 md:text-lg`}>{sampleTexts.counter}</div>
                  <div className={`${selectedBody} mt-4 text-sm opacity-70 md:text-base`}>{sampleTexts.cta}</div>
                </div>
              </div>

              {/* Notebook Page Preview */}
              <div
                className="rounded-lg p-4 md:p-6"
                style={{
                  background: "#f5f0e1",
                  backgroundImage: `repeating-linear-gradient(
                    transparent,
                    transparent 27px,
                    #d4c9b0 28px
                  )`,
                  boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
                }}
              >
                <div className={`${selectedHeader} mb-1 text-xl text-amber-900 md:text-2xl`}>{sampleTexts.heading}</div>
                <div className={`${selectedBody} mb-4 text-base text-amber-700 md:text-lg`}>
                  {sampleTexts.subheading}
                </div>

                {/* Card-like element */}
                <div className="mb-4 rounded border-2 border-amber-300 bg-amber-50/50 p-3">
                  <div className={`${selectedHeader} text-lg text-amber-900 md:text-xl`}>Jordan (Sponsor)</div>
                  <div className={`${selectedBody} text-amber-700`}>good in a crisis · just to talk</div>
                </div>

                {/* Sticky note */}
                <div
                  className="rotate-1 transform rounded p-4"
                  style={{
                    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                    boxShadow: "2px 2px 5px rgba(0,0,0,0.1)",
                  }}
                >
                  <div className={`${selectedHeader} mb-2 text-base text-amber-900 md:text-lg`}>
                    Things I want to talk about
                  </div>
                  <div className={`${selectedBody} text-amber-800`}>{sampleTexts.note}</div>
                </div>

                {/* Quote */}
                <div className="mt-4 border-l-4 border-amber-400 pl-4">
                  <div className={`${selectedBody} text-base italic text-amber-700 md:text-lg`}>
                    &quot;{sampleTexts.quote}&quot;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Selection Summary */}
        <div className="mt-8 rounded-lg border-2 border-blue-200 bg-blue-50 p-4 md:p-6">
          <h2 className="mb-2 text-lg font-semibold text-blue-900">Your Current Selection</h2>
          <p className="text-blue-800">
            <strong>Header Font:</strong> {fonts.headers.find((f) => f.className === selectedHeader)?.name || "None"} —{" "}
            {fonts.headers.find((f) => f.className === selectedHeader)?.description}
            <br />
            <strong>Body Font:</strong> {fonts.body.find((f) => f.className === selectedBody)?.name || "None"} —{" "}
            {fonts.body.find((f) => f.className === selectedBody)?.description}
          </p>
          <p className="mt-3 text-sm text-blue-700">
            When you&apos;re happy with your selection, let me know and I&apos;ll start building the notebook interface
            with these fonts!
          </p>
        </div>
      </div>
    </div>
  )
}
