"use client";

import { useState, useEffect } from "react";

interface EnhancedMoodSelectorProps {
  value: string | null;
  onChange: (mood: string) => void;
  showKeyboardShortcuts?: boolean;
}

const moods = [
  {
    id: "struggling",
    emoji: "😟",
    label: "Struggling",
    color: "text-red-500",
    bg: "bg-red-50",
    ring: "ring-red-300",
    shortcut: "1",
  },
  {
    id: "okay",
    emoji: "😐",
    label: "Okay",
    color: "text-orange-500",
    bg: "bg-orange-50",
    ring: "ring-orange-300",
    shortcut: "2",
  },
  {
    id: "hopeful",
    emoji: "🙂",
    label: "Hopeful",
    color: "text-lime-500",
    bg: "bg-lime-50",
    ring: "ring-lime-300",
    shortcut: "3",
  },
  {
    id: "great",
    emoji: "😊",
    label: "Great",
    color: "text-green-500",
    bg: "bg-green-50",
    ring: "ring-green-300",
    shortcut: "4",
  },
];

export function EnhancedMoodSelector({
  value,
  onChange,
  showKeyboardShortcuts = true,
}: EnhancedMoodSelectorProps) {
  const [hoveredMood, setHoveredMood] = useState<string | null>(null);

  // Keyboard shortcuts for desktop
  useEffect(() => {
    if (!showKeyboardShortcuts) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key;
      const mood = moods.find((m) => m.shortcut === key);
      if (mood && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        if (
          (e.target as HTMLElement).tagName === "INPUT" ||
          (e.target as HTMLElement).tagName === "TEXTAREA"
        ) {
          return;
        }
        onChange(mood.id);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [showKeyboardShortcuts, onChange]);

  return (
    <div className="overflow-visible px-8 -mx-8 py-4 -my-4">
      <div
        className="flex justify-between gap-1 mb-2 overflow-visible"
        role="group"
        aria-label="Mood selection"
      >
        {moods.map((m) => {
          const isSelected = value === m.id;
          const isHovered = hoveredMood === m.id;

          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              onMouseEnter={() => setHoveredMood(m.id)}
              onMouseLeave={() => setHoveredMood(null)}
              aria-label={`Set mood to ${m.label}`}
              aria-pressed={isSelected}
              className={`relative flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
                isSelected
                  ? `${m.bg} scale-110 shadow-lg ring-2 ${m.ring}`
                  : isHovered
                    ? `${m.bg} scale-105`
                    : "hover:bg-amber-50/50"
              }`}
            >
              {/* Glow effect for selected mood */}
              {isSelected && (
                <div
                  className={`absolute inset-0 ${m.bg} opacity-50 blur-xl rounded-lg -z-10 animate-pulse`}
                />
              )}

              <span
                className="text-3xl md:text-4xl filter drop-shadow-sm transition-transform duration-200"
                aria-hidden="true"
              >
                {m.emoji}
              </span>
              <span className={`font-body text-xs ${m.color} mt-1 font-medium`}>{m.label}</span>

              {/* Keyboard shortcut hint */}
              {showKeyboardShortcuts && (
                <span className="hidden md:block text-[10px] text-amber-900/40 mt-0.5">
                  {m.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      {showKeyboardShortcuts && !value && (
        <p className="text-xs text-amber-900/50 text-center hidden md:block">
          Press 1-4 or tap to select
        </p>
      )}
    </div>
  );
}
