"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Feather } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingPenProps {
    onClick?: () => void
}

export function FloatingPen({ onClick }: FloatingPenProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={onClick}
            className={cn(
                "fixed bottom-8 right-8 md:bottom-12 md:right-12 z-50",
                "w-14 h-14 rounded-full flex items-center justify-center",
                "bg-[#3d2914] text-[#e3decb] shadow-xl border-2 border-[#5c4024]",
                "hover:shadow-2xl hover:scale-110 hover:-translate-y-1 transition-all"
            )}
            style={{
                boxShadow: "0 6px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)"
            }}
        >
            <Feather className="w-6 h-6" strokeWidth={2.5} />
        </motion.button>
    )
}
