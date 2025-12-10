"use client"

import { useState } from "react"
import BookCover from "@/components/notebook/book-cover"
import NotebookShell from "@/components/notebook/notebook-shell"
import LampGlow from "@/components/desktop/lamp-glow"
import { AnimatePresence } from "framer-motion"
import { useAuth } from "@/components/providers/auth-provider"

export default function Home() {
  const [isOpen, setIsOpen] = useState(false)
  const { profile } = useAuth()

  const handleOpenBook = () => {
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleCloseBook = () => {
    setIsOpen(false)
  }

  return (
    <main className="fixed inset-0 overflow-auto">
      {/* Wood table background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/wood-table.jpg')`,
        }}
      />

      {/* Subtle vignette overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      <LampGlow />

      {/* Notebook container */}
      <div className="relative z-10 min-h-full w-full flex items-center justify-center py-12 pr-12 md:pr-0">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <BookCover key="cover" onOpen={handleOpenBook} />
          ) : (
            <NotebookShell
              key="shell"
              onClose={handleCloseBook}
              nickname={profile?.nickname || "Friend"}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
