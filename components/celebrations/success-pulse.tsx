"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface SuccessPulseProps {
  message?: string;
  icon?: React.ReactNode;
  color?: string;
}

export function SuccessPulse({
  message = "Success!",
  icon = <CheckCircle2 className="w-16 h-16 md:w-24 md:h-24 text-white" />,
  color = "#10b981",
}: Readonly<SuccessPulseProps>) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-50">
      {/* Expanding ring background */}
      <motion.div
        className="absolute rounded-full"
        style={{ backgroundColor: color }}
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{
          scale: [0, 3, 4],
          opacity: [0.8, 0.4, 0],
        }}
        transition={{
          duration: 1.5,
          ease: "easeOut",
        }}
      />

      {/* Icon pulse */}
      <motion.div
        className="rounded-full p-6 md:p-8 relative z-10"
        style={{ backgroundColor: color }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.3, 1.1, 1],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 2,
          times: [0, 0.3, 0.5, 1],
          ease: "easeOut",
        }}
      >
        {icon}
      </motion.div>

      {/* Message text */}
      {message && (
        <motion.p
          className="mt-4 text-xl md:text-2xl font-bold text-white px-6 py-3 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{
            scale: [0, 1.1, 1],
            opacity: [0, 1, 1, 0],
            y: [20, 0, 0],
          }}
          transition={{
            duration: 2,
            times: [0, 0.4, 1],
            ease: "easeOut",
            delay: 0.2,
          }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
