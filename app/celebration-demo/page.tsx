"use client";

import { useState } from "react";
import {
  CelebrationProvider,
  useCelebration,
} from "@/components/celebrations/celebration-provider";
import {
  CelebrationType,
  CELEBRATION_MESSAGES,
  CELEBRATION_INTENSITY_MAP,
} from "@/components/celebrations/types";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, Star, Trophy, Calendar, Heart, Target, Award } from "lucide-react";

// Event configuration for the demo
const DEMO_EVENTS: Array<{
  type: CelebrationType;
  label: string;
  icon: React.ElementType;
  description: string;
  daysClean?: number;
}> = [
  {
    type: "daily-complete",
    label: "Daily Complete",
    icon: CheckCircle2,
    description: "Completed daily check-in",
  },
  {
    type: "halt-check",
    label: "HALT Check",
    icon: Heart,
    description: "Self-care assessment",
  },
  {
    type: "meeting-attended",
    label: "Meeting Attended",
    icon: Calendar,
    description: "Attended a recovery meeting",
  },
  {
    type: "inventory-complete",
    label: "Inventory Done",
    icon: Target,
    description: "Completed nightly inventory",
  },
  {
    type: "first-entry",
    label: "First Journal Entry",
    icon: Sparkles,
    description: "First journal entry written",
  },
  {
    type: "seven-days",
    label: "7 Days Clean",
    icon: Star,
    description: "One week milestone",
    daysClean: 7,
  },
  {
    type: "thirty-days",
    label: "30 Days Clean",
    icon: Award,
    description: "One month milestone",
    daysClean: 30,
  },
  {
    type: "sixty-days",
    label: "60 Days Clean",
    icon: Award,
    description: "Two months milestone",
    daysClean: 60,
  },
  {
    type: "ninety-days",
    label: "90 Days Clean",
    icon: Trophy,
    description: "Three months milestone",
    daysClean: 90,
  },
  {
    type: "six-months",
    label: "6 Months Clean",
    icon: Trophy,
    description: "Half year milestone",
    daysClean: 180,
  },
  {
    type: "one-year",
    label: "1 Year Clean",
    icon: Trophy,
    description: "One year anniversary!",
    daysClean: 365,
  },
];

function DemoContent() {
  const { celebrate } = useCelebration();
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  const handleCelebrate = (event: (typeof DEMO_EVENTS)[0]) => {
    celebrate(event.type, {
      daysClean: event.daysClean,
    });
    setLastTriggered(event.type);
    setTimeout(() => setLastTriggered(null), 300);
  };

  const getIntensityColor = (type: CelebrationType) => {
    const intensity = CELEBRATION_INTENSITY_MAP[type];
    switch (intensity) {
      case "subtle":
        return "bg-green-100 text-green-700 border-green-300";
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "high":
        return "bg-purple-100 text-purple-700 border-purple-300";
    }
  };

  const getIntensityLabel = (type: CelebrationType) => {
    return CELEBRATION_INTENSITY_MAP[type].toUpperCase();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4">
            🎉 Celebration Animations
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Click any event below to preview the celebration animation. Different events trigger
            different intensity levels.
          </p>
        </motion.div>

        {/* Legend */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full border-2 border-green-300">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="font-medium">Subtle (Pulse)</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full border-2 border-blue-300">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="font-medium">Medium (Confetti)</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full border-2 border-purple-300">
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
            <span className="font-medium">High (Modal + Confetti)</span>
          </div>
        </motion.div>

        {/* Event Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_EVENTS.map((event, index) => {
            const Icon = event.icon;
            const isActive = lastTriggered === event.type;

            return (
              <motion.button
                key={event.type}
                className={`
                  relative overflow-hidden rounded-2xl p-6 
                  bg-white shadow-lg hover:shadow-xl 
                  border-2 transition-all duration-200
                  ${isActive ? "scale-95" : "hover:scale-105"}
                  ${getIntensityColor(event.type)}
                `}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCelebrate(event)}
                whileTap={{ scale: 0.95 }}
              >
                {/* Intensity badge */}
                <div className="absolute top-2 right-2 px-2 py-1 bg-white/80 rounded-full text-xs font-bold">
                  {getIntensityLabel(event.type)}
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    className="p-4 bg-white/50 rounded-full"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-8 h-8" />
                  </motion.div>
                </div>

                {/* Label */}
                <h3 className="font-bold text-lg mb-2">{event.label}</h3>

                {/* Description */}
                <p className="text-sm opacity-75 mb-3">{event.description}</p>

                {/* Days clean badge (if applicable) */}
                {event.daysClean && (
                  <div className="inline-block px-3 py-1 bg-white/50 rounded-full text-xs font-bold">
                    {event.daysClean} days
                  </div>
                )}

                {/* Message preview */}
                <p className="text-xs mt-3 italic opacity-60">
                  &quot;{CELEBRATION_MESSAGES[event.type]}&quot;
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Footer info */}
        <motion.div
          className="mt-12 text-center text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="mb-2">
            💡 <strong>Tip:</strong> Animations auto-dismiss after 2-6 seconds depending on
            intensity.
          </p>
          <p>🎊 The 1-year milestone includes special fireworks! Try it out.</p>
        </motion.div>
      </div>
    </main>
  );
}

export default function CelebrationDemoPage() {
  return (
    <CelebrationProvider>
      <DemoContent />
    </CelebrationProvider>
  );
}
