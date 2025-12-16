"use client"

import { motion } from "framer-motion"
import { Settings } from "lucide-react"

interface BookmarkRibbonProps {
  onClick: () => void
}

export default function BookmarkRibbon({ onClick }: BookmarkRibbonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="absolute top-0 right-2 z-40 w-8 md:w-10 cursor-pointer"
      whileHover={{ y: 4 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Ribbon */}
      <div
        className="relative w-full bg-sky-300 rounded-b-sm"
        style={{
          height: "60px",
          clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
          boxShadow: "2px 4px 8px rgba(0,0,0,0.2)",
        }}
      >
        {/* Ribbon texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />

        {/* Settings icon */}
        <div className="absolute inset-x-0 top-3 flex justify-center">
          <Settings className="w-4 h-4 md:w-5 md:h-5 text-sky-700" />
        </div>
      </div>
    </motion.button>
  )
}
