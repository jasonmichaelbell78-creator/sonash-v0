"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import TabNavigation from "./tab-navigation"
import BookmarkRibbon from "./bookmark-ribbon"
import StickyNote from "./sticky-note"
import PlaceholderPage from "./pages/placeholder-page"
import { useAuth } from "@/components/providers/auth-provider"
import { Shield, AlertTriangle, Plus } from "lucide-react"

import JournalModal from "./journal-modal"
import {
  getModuleById,
  moduleIsEnabled,
  moduleIsStubbed,
  notebookModules,
  type NotebookModuleId,
} from "./roadmap-modules"

// Lazy load the modal
const AccountLinkModal = dynamic(() => import("@/components/auth/account-link-modal"), {
  loading: () => null,
  ssr: false
})

interface NotebookShellProps {
  onClose: () => void
  nickname: string
}

export default function NotebookShell({ onClose, nickname }: NotebookShellProps) {
  const { isAnonymous, showLinkPrompt, profile } = useAuth()
  const tabs = notebookModules.map((module) => ({
    id: module.id,
    label: module.label,
    color: module.color,
    planned: moduleIsStubbed(module),
  }))

  const [activeTab, setActiveTab] = useState<NotebookModuleId>("today")
  const [showSettings, setShowSettings] = useState(false)
  const [showAccountLink, setShowAccountLink] = useState(false)
  const [showJournalModal, setShowJournalModal] = useState(false) // NEW STATE
  const [direction, setDirection] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const handleTabChange = (tabId: string) => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab)
    const newIndex = tabs.findIndex((t) => t.id === tabId)
    setDirection(newIndex > currentIndex ? 1 : -1)
    // Safe cast: tabs are derived from notebookModules, so tabId is always a valid NotebookModuleId
    setActiveTab(tabId as NotebookModuleId)
  }

  const handleSwipe = (event: any, info: any) => {
    const SWIPE_THRESHOLD = 50
    const { offset, velocity } = info

    // Calculate current index
    const currentIndex = tabs.findIndex((t) => t.id === activeTab)

    // Swipe Left (drag x < 0) -> Next Tab
    if (offset.x < -30 || velocity.x < -300) {
      if (currentIndex < tabs.length - 1) {
        handleTabChange(tabs[currentIndex + 1].id)
      }
    }
    // Swipe Right (drag x > 0) -> Previous Tab
    else if (offset.x > 30 || velocity.x > 300) {
      if (currentIndex > 0) {
        handleTabChange(tabs[currentIndex - 1].id)
      }
    }
  }

  const renderPage = () => {
    const module = getModuleById(activeTab) ?? notebookModules[0]

    if (moduleIsEnabled(module)) {
      // Pass handleTabChange as onNavigate
      return module.render({ nickname, onNavigate: handleTabChange })
    }

    const flagText = module.featureFlag
      ? `Enable ${module.label} by setting ${module.featureFlag}=true.`
      : "This section is planned on the roadmap."

    return (
      <PlaceholderPage
        title={`${module.label} (stub)`}
        description={`${module.description} ${flagText}`}
      />
    )
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
        className="relative w-[340px] h-[520px] md:w-[800px] md:h-[560px] rounded-lg overflow-visible"
        style={{
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 12px 24px -8px rgba(0, 0, 0, 0.3)
          `,
        }}
      >
        {/* Spine */}
        <div
          className="absolute left-0 top-0 bottom-0 w-4 md:w-10 z-20 rounded-l-lg"
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
          className="absolute left-4 md:left-10 right-0 top-0 bottom-0 rounded-r-lg overflow-hidden"
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
              className="absolute inset-0 p-4 pl-8 pr-4 md:p-6 md:pl-16 md:pr-12 touch-pan-y"
              onTouchStart={(e) => {
                setTouchEnd(null)
                setTouchStart(e.targetTouches[0].clientX)
              }}
              onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
              onTouchEnd={() => {
                if (!touchStart || !touchEnd) return
                const distance = touchStart - touchEnd
                const isLeftSwipe = distance > 50
                const isRightSwipe = distance < -50

                const currentIndex = tabs.findIndex((t) => t.id === activeTab)

                if (isLeftSwipe && currentIndex < tabs.length - 1) {
                  handleTabChange(tabs[currentIndex + 1].id)
                }
                if (isRightSwipe && currentIndex > 0) {
                  handleTabChange(tabs[currentIndex - 1].id)
                }
              }}
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
                duration: 0.3,
                ease: "easeOut",
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

        {/* UNIVERSAL FAB */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowJournalModal(true)}
          aria-label="Open journal"
          className="absolute bottom-6 right-6 md:bottom-8 md:right-12 z-50 bg-amber-500 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-amber-600 border-2 border-white"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div >

      {/* Settings sticky note overlay */}
      <AnimatePresence>
        {
          showSettings && (
            <StickyNote title="My Notebook" onClose={() => setShowSettings(false)}>
              <div className="space-y-3">
                {/* Account Security Section */}
                {isAnonymous && (
                  <div className={`p-3 rounded-lg border ${showLinkPrompt ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-start gap-2">
                      {showLinkPrompt ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`font-handlee text-sm ${showLinkPrompt ? 'text-amber-800' : 'text-blue-800'}`}>
                          {showLinkPrompt
                            ? "Your journal is at risk! Link your account to keep your entries safe."
                            : "Your account is anonymous. Link it to keep your data safe."}
                        </p>
                        <button
                          onClick={() => {
                            setShowSettings(false)
                            setShowAccountLink(true)
                          }}
                          className={`mt-2 text-sm font-handlee underline ${showLinkPrompt ? 'text-amber-700 hover:text-amber-900' : 'text-blue-700 hover:text-blue-900'}`}
                        >
                          Secure My Account →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show linked account info */}
                {!isAnonymous && profile?.email && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <p className="font-handlee text-sm text-green-800">
                        Signed in as {profile.email}
                      </p>
                    </div>
                  </div>
                )}

                <p className="font-body text-amber-900/40">Nickname & privacy (coming soon)</p>
                <p className="font-body text-amber-900/40">Home screen & favorites (coming soon)</p>
                <p className="font-body text-amber-900/40">Language & text size (coming soon)</p>

                <div className="pt-4 border-t border-amber-900/10">
                  <button
                    onClick={async () => {
                      try {
                        const { signOut } = await import("firebase/auth")
                        const { auth } = await import("@/lib/firebase")

                        // Clear local temp data for security
                        localStorage.removeItem("sonash_journal_temp")

                        await signOut(auth)
                        onClose() // Close the book
                      } catch (error) {
                        console.error("Sign out failed:", error)
                        // Import toast dynamically to avoid issues
                        const { toast } = await import("sonner")
                        toast.error("Failed to sign out. Please try again.")
                      }
                    }}
                    className="font-handlee text-red-800/70 hover:text-red-800 hover:underline flex items-center gap-2"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </StickyNote>
          )
        }
      </AnimatePresence >

      {/* Account Link Modal */}
      <AnimatePresence>
        {
          showAccountLink && (
            <AccountLinkModal
              onClose={() => setShowAccountLink(false)}
              onSuccess={() => setShowAccountLink(false)}
            />
          )
        }
      </AnimatePresence >

      {/* Journal Modal Overlay */}
      <AnimatePresence>
        {
          showJournalModal && (
            <JournalModal onClose={() => setShowJournalModal(false)} />
          )
        }
      </AnimatePresence >
    </motion.div >
  )
}
