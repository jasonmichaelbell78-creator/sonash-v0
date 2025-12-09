"use client"

import Image from "next/image"

interface SobrietyChipProps {
  cleanDays: number
}

const chipUrl = "/images/gemini-generated-image-n61yzln61yzln61y.png"

// Determine which chip to show based on clean days
function getChipMilestone(days: number): { label: string; image: string } {
  // Using same chip image for now - will need different images per milestone later
  if (days >= 730) return { label: "2+ Years", image: chipUrl }
  if (days >= 548) return { label: "18 Months", image: chipUrl }
  if (days >= 365) return { label: "1 Year", image: chipUrl }
  if (days >= 270) return { label: "9 Months", image: chipUrl }
  if (days >= 180) return { label: "6 Months", image: chipUrl }
  if (days >= 90) return { label: "90 Days", image: chipUrl }
  if (days >= 60) return { label: "60 Days", image: chipUrl }
  if (days >= 30) return { label: "30 Days", image: chipUrl }
  if (days >= 1) return { label: "24 Hours", image: chipUrl }
  return { label: "Welcome", image: chipUrl }
}

export default function SobrietyChip({ cleanDays }: SobrietyChipProps) {
  const milestone = getChipMilestone(cleanDays)

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        bottom: "8%",
        left: "5%",
        width: "150px",
        height: "150px",
        zIndex: 30,
      }}
    >
      <Image
        src={chipUrl || "/placeholder.svg"}
        alt={`${milestone.label} Sobriety Chip`}
        fill
        className="object-contain"
        style={{
          filter: "drop-shadow(3px 5px 8px rgba(0,0,0,0.5))",
        }}
        unoptimized
      />
    </div>
  )
}
