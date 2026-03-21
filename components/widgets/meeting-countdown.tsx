"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, Calendar } from "lucide-react";

const DEFAULT_MEETING_HOUR = 19; // 7:00 PM
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_MINUTE = 1000 * 60;
const TIMER_INTERVAL_MS = 60000; // Update every minute

/**
 * Meeting Countdown Timer - shows time until next meeting
 * For now displays a placeholder - will integrate with favorites later
 */
export default function MeetingCountdown() {
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Define interval handler as stable useCallback before the effect (CLAUDE.md meeting widget requirement)
  const calculateNextMeeting = useCallback(() => {
    const now = new Date();
    const today7PM = new Date();
    today7PM.setHours(DEFAULT_MEETING_HOUR, 0, 0, 0);

    let nextMeeting = today7PM;
    if (now > today7PM) {
      // If past 7 PM, show tomorrow at 7 PM
      nextMeeting = new Date(today7PM.getTime() + MS_PER_DAY);
    }

    const diff = nextMeeting.getTime() - now.getTime();
    const hours = Math.floor(diff / MS_PER_HOUR);
    const minutes = Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE);

    if (hours === 0) {
      setTimeRemaining(`${minutes}m`);
    } else if (hours < 24) {
      setTimeRemaining(`${hours}h ${minutes}m`);
    } else {
      setTimeRemaining(`Tomorrow 7:00 PM`);
    }
  }, []);

  useEffect(() => {
    calculateNextMeeting();
    const interval = setInterval(calculateNextMeeting, TIMER_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [calculateNextMeeting]);

  if (!timeRemaining) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative bg-gradient-to-br from-blue-50/95 to-blue-100/95 backdrop-blur-sm rounded-lg p-4 shadow-md border border-blue-200/60 hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
    >
      {/* Clock icon */}
      <Clock className="absolute top-2 right-2 w-5 h-5 text-blue-400/60 group-hover:text-blue-500/70 transition-colors" />

      {/* Content */}
      <div className="pr-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Calendar className="w-4 h-4 text-blue-500/70" />
          <span className="font-handlee text-xs font-medium text-blue-700/70 uppercase tracking-wide">
            Next Meeting
          </span>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="font-handlee text-2xl font-bold text-blue-900">{timeRemaining}</span>
          <span className="font-handlee text-xs text-blue-600/60">away</span>
        </div>

        {/* Placeholder meeting name */}
        <div className="flex items-center gap-1.5 mt-2">
          <MapPin className="w-3 h-3 text-blue-500/50" />
          <span className="font-handlee text-xs text-blue-700/60">Evening AA • Downtown</span>
        </div>
      </div>

      {/* "Tap to view" hint */}
      <div className="absolute bottom-1 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50" />
        <span className="text-[10px] uppercase tracking-wider font-medium text-blue-600/50">
          Tap for details
        </span>
      </div>
    </motion.div>
  );
}
