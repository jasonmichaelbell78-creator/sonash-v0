"use client"

import { motion } from "framer-motion"

interface Tab {
  id: string
  label: string
  color: string
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="absolute right-0 top-8 bottom-8 w-8 md:w-10 flex flex-col justify-start gap-1 z-30 translate-x-full">
      {tabs.map((tab, index) => (
        <motion.button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            relative h-16 md:h-20 w-10 md:w-12 rounded-r-lg
            ${tab.color}
            ${activeTab === tab.id ? "w-12 md:w-14" : ""}
            transition-all duration-200
            hover:w-12 md:hover:w-14
          `}
          style={{
            boxShadow: activeTab === tab.id ? "2px 2px 8px rgba(0,0,0,0.2)" : "1px 1px 4px rgba(0,0,0,0.1)",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
          }}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.95 }}
        >
          <span
            className="font-body text-xs md:text-sm text-amber-900/70 rotate-180 block"
            style={{ transform: "rotate(180deg)" }}
          >
            {tab.label}
          </span>

          {/* Tab edge effect */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-black/10 to-transparent" />
        </motion.button>
      ))}

      {/* Placeholder space for future tabs */}
      <div className="flex-1 min-h-8" />
    </div>
  )
}
