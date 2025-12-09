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
            paddingTop: "8%",
            paddingBottom: "8%",
            paddingLeft: "18%",
            paddingRight: "18%",
          }}
        >
          {/* Top section - Branding */}
          <div className="flex flex-col items-center">
            <h1
              className="font-rocksalt text-2xl md:text-3xl leading-tight text-center"
              style={{
                color: "#e0d8cc",
                textShadow: `
                  1px 1px 0px rgba(0,0,0,0.7),
                  2px 2px 3px rgba(0,0,0,0.5),
                  -1px -1px 0px rgba(255,255,255,0.2)
                `,
              }}
            >
              SoNash
            </h1>

            <p
              className="font-shortstack text-base md:text-lg tracking-wide mt-1"
              style={{
                color: "#d4ccc0",
                textShadow: `
                  1px 1px 0px rgba(0,0,0,0.6),
                  2px 2px 2px rgba(0,0,0,0.4),
                  -1px -1px 0px rgba(255,255,255,0.2)
                `,
              }}
            >
              Sober Nashville
            </p>
          </div>

          <div className="flex flex-col items-center mt-auto" style={{ marginLeft: "-1%" }}>
            <h2
              className="font-rocksalt text-lg md:text-xl leading-relaxed text-center"
              style={{
                color: "#e0d8cc",
                textShadow: `
                  1px 1px 0px rgba(0,0,0,0.7),
                  2px 2px 3px rgba(0,0,0,0.5),
                  -1px -1px 0px rgba(255,255,255,0.2)
                `,
              }}
            >
              {nickname}'s
              <br />
              Recovery Notebook
            </h2>
          </div>

          <div className="flex flex-col items-center mt-auto">
            <p
              className="font-shortstack text-sm md:text-base text-center leading-snug"
              style={{
                color: "#d4ccc0",
                textShadow: `
                  1px 1px 0px rgba(0,0,0,0.6),
                  2px 2px 2px rgba(0,0,0,0.4),
                  -1px -1px 0px rgba(255,255,255,0.2)
                `,
              }}
            >
              You've been clean
              <br />
              for {cleanDays} days.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-auto">
            <p
              className="font-shortstack text-xs md:text-sm"
              style={{
                color: "#d4ccc0",
                textShadow: `
                  1px 1px 0px rgba(0,0,0,0.6),
                  2px 2px 2px rgba(0,0,0,0.4),
                  -1px -1px 0px rgba(255,255,255,0.2)
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
