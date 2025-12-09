"use client"

import { motion } from "framer-motion"
import Image from "next/image"

interface BookCoverProps {
  onOpen: () => void
  isAnimating: boolean
  nickname?: string
  cleanDays?: number
}

export default function BookCover({ onOpen, isAnimating, nickname = "Friend", cleanDays = 0 }: BookCoverProps) {
  return (
    <motion.div
      className="relative cursor-pointer"
      onClick={onOpen}
      initial={{ rotateY: 0, scale: 1 }}
      animate={
        isAnimating
          ? {
              rotateY: -180,
              scale: 0.9,
              x: 100,
            }
          : {
              rotateY: 0,
              scale: 1,
              x: 0,
            }
      }
      transition={{
        duration: 1.5,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1500px",
      }}
      whileHover={{ scale: 1.02, y: -8 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Book shadow on table */}
      <div
        className="absolute -bottom-8 left-1/2 w-[90%] h-16"
        style={{
          background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 50%, transparent 80%)",
          filter: "blur(20px)",
          transform: "translateX(-50%) scaleY(0.4)",
        }}
      />

      <div
        className="relative"
        style={{
          width: "1200px",
          height: "1700px",
          maxWidth: "90vw",
          maxHeight: "85vh",
        }}
      >
        <Image
          src="/images/notebook-cover-blank.png"
          alt="SoNash Recovery Notebook"
          fill
          className="object-contain"
          style={{
            filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.4))",
          }}
          priority
        />

        <div
          className="absolute inset-0 flex flex-col items-center pointer-events-none"
          style={{
            paddingTop: "15%",
            paddingBottom: "8%",
            paddingLeft: "18%",
            paddingRight: "22%",
          }}
        >
          {/* Top section - Branding */}
          <div className="flex flex-col items-center">
            {/* SoNash title */}
            <h1
              className="font-rocksalt text-4xl md:text-5xl leading-tight text-center"
              style={{
                color: "#3d2914",
                textShadow: `
                  1px 1px 0px rgba(0,0,0,0.5),
                  2px 2px 3px rgba(0,0,0,0.3),
                  -1px -1px 0px rgba(180,160,140,0.3)
                `,
              }}
            >
              SoNash
            </h1>

            {/* Sober Nashville subtitle */}
            <p
              className="font-shortstack text-xl md:text-2xl tracking-wide mt-1"
              style={{
                color: "#4a3520",
                textShadow: `
                  1px 1px 0px rgba(0,0,0,0.4),
                  2px 2px 2px rgba(0,0,0,0.25),
                  -1px -1px 0px rgba(180,160,140,0.25)
                `,
              }}
            >
              Sober Nashville
            </p>
          </div>

          {/* Middle section - Personalized title */}
          <div className="flex flex-col items-center mt-auto">
            <h2
              className="font-rocksalt text-2xl md:text-3xl leading-relaxed text-center"
              style={{
                color: "#3d2914",
                textShadow: `
                  1px 1px 0px rgba(0,0,0,0.5),
                  2px 2px 3px rgba(0,0,0,0.3),
                  -1px -1px 0px rgba(180,160,140,0.3)
                `,
              }}
            >
              {nickname}'s
              <br />
              Recovery Notebook
            </h2>
          </div>

          {/* Clean days counter */}
          <div className="flex flex-col items-center mt-auto">
            <p
              className="font-shortstack text-xl md:text-2xl text-center leading-snug"
              style={{
                color: "#4a3520",
                textShadow: `
                  1px 1px 0px rgba(0,0,0,0.4),
                  2px 2px 2px rgba(0,0,0,0.25),
                  -1px -1px 0px rgba(180,160,140,0.25)
                `,
              }}
            >
              You've been clean
              <br />
              for {cleanDays} days.
            </p>
          </div>

          {/* Bottom section - CTA */}
          <div className="flex items-center gap-2 mt-auto">
            <p
              className="font-shortstack text-lg md:text-xl"
              style={{
                color: "#4a3520",
                textShadow: `
                  1px 1px 0px rgba(0,0,0,0.4),
                  2px 2px 2px rgba(0,0,0,0.25),
                  -1px -1px 0px rgba(180,160,140,0.25)
                `,
              }}
            >
              Turn to Today's Page →
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
