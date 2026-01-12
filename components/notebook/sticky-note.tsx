"use client";

import type React from "react";

import { motion } from "framer-motion";
import { X } from "lucide-react";

interface StickyNoteProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function StickyNote({ title, onClose, children }: StickyNoteProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-[280px] md:w-[320px] bg-amber-50 rounded-sm p-6 cursor-default"
        style={{
          boxShadow: `
            4px 4px 12px rgba(0,0,0,0.3),
            0 0 0 1px rgba(0,0,0,0.05)
          `,
          transform: "rotate(-2deg)",
          background: "linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%)",
        }}
        initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: -2 }}
        exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tape effect at top */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-amber-100/80 rounded-sm"
          style={{
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            transform: "translateX(-50%) rotate(1deg)",
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-amber-700/50 hover:text-amber-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h3 className="font-heading text-xl text-amber-900 underline mb-4">{title}</h3>

        {/* Content */}
        <div className="font-body text-amber-900/80">{children}</div>

        {/* Paper texture */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none rounded-sm"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}
