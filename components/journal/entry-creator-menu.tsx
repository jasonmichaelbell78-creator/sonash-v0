"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smile, Heart, CheckSquare, PenTool, SunMedium } from "lucide-react";

interface EntryCreatorMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: "mood" | "gratitude" | "inventory" | "free-write" | "daily-log") => void;
}

const menuItems = [
  {
    id: "daily-log",
    label: "Daily Check-in",
    icon: SunMedium,
    color: "var(--journal-ribbon-red)",
    description: "Mood, cravings/used, and a quick note.",
  },
  {
    id: "mood",
    label: "Mood Check-in",
    icon: Smile,
    color: "var(--journal-ribbon-blue)",
    description: "Track how you are feeling right now.",
  },
  {
    id: "gratitude",
    label: "Gratitude List",
    icon: Heart,
    color: "var(--journal-ribbon-green)",
    description: "What are you thankful for today?",
  },
  {
    id: "inventory",
    label: "Daily Inventory",
    icon: CheckSquare,
    color: "var(--journal-ribbon-purple)",
    description: "Review your day honestly.",
  },
  {
    id: "free-write",
    label: "Free Write",
    icon: PenTool,
    color: "var(--journal-ribbon-yellow)",
    description: "Just let the thoughts flow.",
  },
] as const;

export function EntryCreatorMenu({
  isOpen,
  onClose,
  onSelectType,
}: Readonly<EntryCreatorMenuProps>) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Menu Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-[#f0eadd] w-full max-w-md rounded-lg shadow-2xl p-6 relative pointer-events-auto border-2 border-[var(--journal-line)]/20">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-[var(--journal-text)]/50 hover:text-[var(--journal-text)] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="font-heading text-2xl text-[var(--journal-text)] text-center mb-6">
                New Entry
              </h2>

              <div className="space-y-4">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectType(item.id)}
                    className="w-full flex items-center p-4 rounded-lg bg-white/50 border border-white/60 shadow-sm hover:shadow-md transition-all group text-left"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 mr-4 text-white shadow-inner"
                      style={{ backgroundColor: item.color }}
                    >
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg text-[var(--journal-text)] group-hover:text-[var(--journal-ribbon-blue)] transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-sm text-[var(--journal-text)]/60 font-handlee">
                        {item.description}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
