"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertTriangle, Heart, Calendar, StickyNote, BookOpen, ClipboardCheck } from "lucide-react";

interface RibbonNavProps {
  activeTab: string | null;
  onTabChange: (tab: string) => void;
}

const ribbons = [
  {
    id: "crisis",
    color: "bg-red-500",
    hoverColor: "hover:bg-red-600",
    label: "Crisis",
    icon: AlertTriangle,
    description: "Spot checks",
  },
  {
    id: "gratitude",
    color: "bg-emerald-500",
    hoverColor: "hover:bg-emerald-600",
    label: "Gratitude",
    icon: Heart,
    description: "Gratitude lists",
  },
  {
    id: "daily",
    color: "bg-sky-500",
    hoverColor: "hover:bg-sky-600",
    label: "Daily",
    icon: Calendar,
    description: "Moods & check-ins",
  },
  {
    id: "notes",
    color: "bg-amber-500",
    hoverColor: "hover:bg-amber-600",
    label: "Notes",
    icon: StickyNote,
    description: "Recovery notepad",
  },
  {
    id: "inventory",
    color: "bg-purple-500",
    hoverColor: "hover:bg-purple-600",
    label: "Inventory",
    icon: BookOpen,
    description: "Night reviews",
  },
  {
    id: "stepwork",
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600",
    label: "Step Work",
    icon: ClipboardCheck,
    description: "Step worksheets",
  },
];

export function RibbonNav({ activeTab, onTabChange }: Readonly<RibbonNavProps>) {
  return (
    <div className="mb-6">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-handlee text-amber-900/60">Filter by:</span>
        <button
          onClick={() => onTabChange("")}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-all",
            activeTab === null
              ? "bg-amber-900 text-white shadow-sm"
              : "bg-amber-100 text-amber-900 hover:bg-amber-200"
          )}
        >
          All
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ribbons.map((ribbon) => {
          const Icon = ribbon.icon;
          const isActive = activeTab === ribbon.id;

          return (
            <motion.button
              key={ribbon.id}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm border-2 transition-all text-white font-medium text-sm",
                ribbon.color,
                ribbon.hoverColor,
                isActive
                  ? "ring-2 ring-amber-900/50 scale-105 shadow-md"
                  : "border-transparent opacity-80 hover:opacity-100"
              )}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange(ribbon.id)}
            >
              <Icon className="w-4 h-4" />
              <div className="flex flex-col items-start">
                <span>{ribbon.label}</span>
                <span className="text-[10px] opacity-80 font-normal">{ribbon.description}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
