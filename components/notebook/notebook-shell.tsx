"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import TabNavigation from "./tab-navigation"
import BookmarkRibbon from "./bookmark-ribbon"
import StickyNote from "./sticky-note"
import TodayPage from "./pages/today-page"
import ResourcesPage from "./pages/resources-page"
import SupportPage from "./pages/support-page"
import PlaceholderPage from "./pages/placeholder-page"

interface NotebookShellProps {
  onClose: () => void
  nickname: string
}

const tabs = [
  { id: "today", label: "Today", color: "bg-sky-200" },
  { id: "resources", label: "Resources", color: "bg-orange-200" },
  { id: "support", label: "Support", color: "bg-green-200" },
  { id: "growth", label: "Growth", color: "bg-yellow-200" },
  { id: "work", label: "Work", color: "bg-purple-200" },
  { id: "more", label: "More", color: "bg-pink-200" },
]

export default function NotebookShell({ onClose, nickname }: NotebookShellProps) {
  const [activeTab, setActiveTab] = useState("today")
  const [showSettings, setShowSettings] = useState(false)
  const [direction, setDirection] = useState(0)

  const handleTabChange = (tabId: string) => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab)
    const newIndex = tabs.findIndex((t) => t.id === tabId)
    setDirection(newIndex > currentIndex ? 1 : -1)
    setActiveTab(tabId)
  }

  const renderPage = () => {
    switch (activeTab) {
      case "today":
        return <TodayPage nickname={nickname} />
      case "resources":
        return <ResourcesPage />
      case "support":
        return <SupportPage />
      case "growth":
        return (
          <PlaceholderPage
            title="Growth"
            description="Step work, reflections, and personal development tools coming soon."
          />
        )
      case "work":
        return (
          <PlaceholderPage
            title="Work"
            description="Employment resources, resume tools, and job search features coming soon."
          />
        )
      case "more":
        return <PlaceholderPage title="More" description="Additional features and settings coming soon." />
      default:
        return <TodayPage nickname={nickname} />
    }
  }

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Book shadow */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[95%] h-10 bg-black/40 blur-2xl rounded-full" />

      {/* Main notebook container */}
      <div
        className="relative w-[360px] h-[520px] md:w-[800px] md:h-[560px] rounded-lg overflow-visible"
        style={{
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 12px 24px -8px rgba(0, 0, 0, 0.3)
          `,
        }}
      >
        {/* Spine */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 md:w-10 z-20 rounded-l-lg"
          style={{
            background: `
              linear-gradient(90deg, rgba(60, 100, 115, 1) 0%, rgba(70, 115, 130, 1) 50%, rgba(50, 85, 100, 1) 100%)
            `,
            boxShadow: "inset -2px 0 4px rgba(0,0,0,0.3)",
          }}
        >
          {/* Spine texture */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Page content area */}
        <div
          className="absolute left-8 md:left-10 right-0 top-0 bottom-0 rounded-r-lg overflow-hidden"
          style={{
            background: `linear-gradient(135deg, #f5f0e6 0%, #ebe5d9 50%, #e5dfd3 100%)`,
          }}
        >
          {/* Paper texture */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23paper)' opacity='0.4'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Lined paper effect */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px bg-sky-200/30"
                style={{ top: `${(i + 1) * 22}px` }}
              />
            ))}
          </div>

          {/* Red margin line */}
          <div className="absolute left-12 top-0 bottom-0 w-px bg-red-300/40" />

          {/* Page content with swipe animation */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              className="absolute inset-0 p-6 pl-16 pr-12"
              initial={{
                rotateY: direction > 0 ? 90 : -90,
                opacity: 0,
                originX: direction > 0 ? 0 : 1,
              }}
              animate={{
                rotateY: 0,
                opacity: 1,
              }}
              exit={{
                rotateY: direction > 0 ? -90 : 90,
                opacity: 0,
                originX: direction > 0 ? 0 : 1,
              }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tab navigation */}
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Bookmark ribbon for settings */}
        <BookmarkRibbon onClick={() => setShowSettings(true)} />
      </div>

      {/* Settings sticky note overlay */}
      <AnimatePresence>
        {showSettings && (
          <StickyNote title="My Notebook" onClose={() => setShowSettings(false)}>
            <div className="space-y-3">
              <p className="font-body text-amber-900/70 underline">Nickname & privacy</p>
              <p className="font-body text-amber-900/70 underline">Home screen & favorites</p>
              <p className="font-body text-amber-900/70 underline">Language & text size</p>
            </div>
          </StickyNote>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
