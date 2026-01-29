"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  CelebrationType,
  CelebrationEvent,
  CELEBRATION_INTENSITY_MAP,
  CELEBRATION_MESSAGES,
} from "./types";
import { CelebrationOverlay } from "./celebration-overlay";

interface CelebrationContextType {
  celebrate: (type: CelebrationType, data?: Partial<CelebrationEvent>) => void;
  clearCelebration: () => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [activeEvent, setActiveEvent] = useState<CelebrationEvent | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount (REACT-001 fix)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const celebrate = useCallback((type: CelebrationType, data: Partial<CelebrationEvent> = {}) => {
    // Clear any existing timeout to prevent memory leak (REACT-001 fix)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const event: CelebrationEvent = {
      type,
      intensity: data.intensity || CELEBRATION_INTENSITY_MAP[type],
      message: data.message || CELEBRATION_MESSAGES[type],
      daysClean: data.daysClean,
      customData: data.customData,
    };

    setActiveEvent(event);

    // Auto-dismiss after animation completes (based on intensity)
    const dismissDelay =
      event.intensity === "high" ? 6000 : event.intensity === "medium" ? 4000 : 2500;
    timeoutRef.current = setTimeout(() => setActiveEvent(null), dismissDelay);
  }, []);

  const clearCelebration = useCallback(() => {
    // Clear timeout when manually clearing (REACT-001 fix)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveEvent(null);
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate, clearCelebration }}>
      {children}
      {activeEvent && <CelebrationOverlay event={activeEvent} onClose={clearCelebration} />}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error("useCelebration must be used within CelebrationProvider");
  }
  return context;
}
