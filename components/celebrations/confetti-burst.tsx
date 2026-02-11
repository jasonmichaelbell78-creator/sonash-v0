"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { CELEBRATION_COLORS } from "./types";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocityX: number;
  shape: "circle" | "square" | "rectangle";
  finalRotation: number;
  animationDuration: number;
}

interface ConfettiBurstProps {
  intensity?: number;
  duration?: number;
  colors?: string[];
}

export function ConfettiBurst({
  intensity = 50,
  duration = 4,
  colors = Object.values(CELEBRATION_COLORS),
}: Readonly<ConfettiBurstProps>) {
  // Use lazy initialization to avoid setState in effect
  const [pieces] = useState<ConfettiPiece[]>(() => {
    if (typeof globalThis.window === "undefined") return [];

    return Array.from({ length: intensity }, (_, i) => {
      const shapes: ("circle" | "square" | "rectangle")[] = ["circle", "square", "rectangle"];
      return {
        id: i,
        x: Math.random() * globalThis.innerWidth,
        y: -20 - Math.random() * 100, // Stagger starting positions
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4, // 4-12px
        velocityX: (Math.random() - 0.5) * 300, // Horizontal spread
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        finalRotation: Math.random() * 360 + (Math.random() * 720 + 360), // Pre-calculate final rotation
        animationDuration: duration + Math.random() * 2, // Pre-calculate animation duration
      };
    });
  });

  if (typeof globalThis.window === "undefined") return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: piece.x,
            backgroundColor: piece.color,
            width: piece.shape === "rectangle" ? piece.size * 1.5 : piece.size,
            height: piece.size,
            borderRadius: (() => {
              if (piece.shape === "circle") return "50%";
              if (piece.shape === "square") return "2px";
              return "1px";
            })(),
          }}
          initial={{
            y: piece.y,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: globalThis.innerHeight + 100,
            rotate: piece.finalRotation, // Use pre-calculated value
            opacity: [1, 1, 0.8, 0],
            x: piece.x + piece.velocityX,
          }}
          transition={{
            duration: piece.animationDuration, // Use pre-calculated value
            ease: [0.25, 0.1, 0.25, 1], // Custom easing for natural fall
            opacity: {
              times: [0, 0.7, 0.9, 1],
              duration: duration,
            },
          }}
        />
      ))}
    </div>
  );
}
