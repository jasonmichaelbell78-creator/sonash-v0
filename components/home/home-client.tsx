"use client";

import { useState } from "react";
import BookCover from "@/components/notebook/book-cover";
import NotebookShell from "@/components/notebook/notebook-shell";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/auth-provider";
import { AuthErrorBanner } from "@/components/status/auth-error-banner";

/**
 * Client-side interactive portion of the home page.
 * Handles book open/close state and auth-dependent UI.
 *
 * SSR optimization: Static background rendered in server component (app/page.tsx).
 * This component handles only the interactive parts that require client-side state.
 *
 * @see CANON-0045: Landing page SSR optimization
 */
export default function HomeClient() {
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
    <>
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
    </>
  );
}
