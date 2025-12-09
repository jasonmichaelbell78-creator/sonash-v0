"use client"

import { useState } from "react"
import BookCover from "@/components/notebook/book-cover"
import NotebookShell from "@/components/notebook/notebook-shell"

export default function Home() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const nickname = "Alex"
  const cleanDays = 37

  const handleOpenBook = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setTimeout(() => {
      setIsOpen(true)
      setIsAnimating(false)
    }, 1500)
  }

  const handleCloseBook = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsOpen(false)
    setTimeout(() => {
      setIsAnimating(false)
    }, 1500)
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
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {/* Notebook container - centered with padding for scroll */}
      <div className="relative z-10 min-h-full w-full flex items-center justify-center py-12">
        {!isOpen ? (
          <BookCover onOpen={handleOpenBook} isAnimating={isAnimating} nickname={nickname} cleanDays={cleanDays} />
        ) : (
          <NotebookShell onClose={handleCloseBook} nickname={nickname} />
        )}
      </div>
    </main>
  )
}
