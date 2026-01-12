"use client";

import { useState } from "react";
import BookCover from "@/components/notebook/book-cover";
import NotebookShell from "@/components/notebook/notebook-shell";
import LampGlow from "@/components/desktop/lamp-glow";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/auth-provider";
import { AuthErrorBanner } from "@/components/status/auth-error-banner";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();

  const handleOpenBook = () => {
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleCloseBook = () => {
    setIsOpen(false);
  };

  return (
    <main className="fixed inset-0 overflow-y-auto overflow-x-hidden">
      {/* Wood table background */}
      <div
        className="fixed inset-0 min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/wood-table.jpg')`,
        }}
      />

      {/* Subtle vignette overlay for depth */}
      <div
        className="fixed inset-0 min-h-screen pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      <LampGlow />

      <div className="relative z-10 px-6 pt-6">
        <AuthErrorBanner />
      </div>

      {/* Notebook container - asymmetrical padding to account for tabs on right */}
      <div className="relative z-10 min-h-full w-full flex items-center justify-center py-12 pl-4 pr-14 md:px-0">
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
  );
}
