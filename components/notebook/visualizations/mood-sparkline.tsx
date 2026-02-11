"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FirestoreService, type DailyLog } from "@/lib/firestore-service";
import { useAuth } from "@/components/providers/auth-provider";
import { logger, maskIdentifier } from "@/lib/logger";

export default function MoodSparkline() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        const history = await FirestoreService.getHistory(user.uid);
        // Get last 7 entries, reverse to make chronological
        setLogs(history.entries.slice(0, 7).reverse());
        if (history.error) {
          logger.warn("Mood sparkline history incomplete", {
            userId: maskIdentifier(user.uid),
            error: history.error,
          });
        }
      } catch (error) {
        logger.error("Failed to load mood history", { userId: maskIdentifier(user.uid), error });
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user]);

  if (loading || logs.length === 0) return null;

  // Map moods to numeric values
  const moodValue = (mood: string | null) => {
    switch (mood) {
      case "great":
        return 4;
      case "hopeful":
        return 3;
      case "okay":
        return 2;
      case "struggling":
        return 1;
      default:
        return 0; // No data or unknown
    }
  };

  const dataPoints = logs.map((log) => ({
    date: log.date,
    value: moodValue(log.mood),
    mood: log.mood,
  }));

  const width = 100; // viewbox width
  const height = 40; // viewbox height
  const step = width / (dataPoints.length - 1 || 1);

  // Generate path
  const points = dataPoints
    .map((p, i) => {
      const x = i * step;
      // Invert y because SVG 0 is top. Scale 4 to height-5, 0 to 5.
      const y = height - (p.value / 4) * (height - 10) - 5;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-4 p-4 bg-white/40 rounded-lg backdrop-blur-sm border border-amber-900/10">
      <h3 className="font-heading text-sm text-amber-900/70 mb-2">Mood Trends</h3>
      <div className="relative w-full h-12">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Trend line */}
          <motion.path
            d={`M ${points}`}
            fill="none"
            stroke="#b45309"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Dots */}
          {dataPoints.map((p, i) => {
            const x = i * step;
            const y = height - (p.value / 4) * (height - 10) - 5;
            return (
              <motion.circle
                key={`${p.date}-${i}`}
                cx={x}
                cy={y}
                r="3"
                fill={p.value >= 2 ? "#d97706" : "#ef4444"}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.5 + i * 0.1 }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
