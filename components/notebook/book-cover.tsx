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
    <div
      className="relative cursor-pointer"
      onClick={onOpen}
      style={{
        perspective: "2000px",
      }}
    >
      {/* Book shadow on table */}
      <motion.div
        className="absolute -bottom-8 left-1/2 w-[90%] h-16"
        style={{
          background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 50%, transparent 80%)",
          filter: "blur(20px)",
          transform: "translateX(-50%) scaleY(0.4)",
        }}
        animate={isAnimating ? { opacity: 0.3 } : { opacity: 1 }}
        transition={{ duration: 0.8 }}
      />

      {/* Book base/pages underneath (visible when cover opens) */}
      <motion.div
        className="absolute"
        style={{
          width: "1200px",
          height: "1700px",
          maxWidth: "90vw",
          maxHeight: "85vh",
          background: `linear-gradient(135deg, #f5f0e6 0%, #ebe5d9 50%, #e5dfd3 100%)`,
          borderRadius: "8px",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.1)",
        }}
        initial={{ opacity: 0 }}
        animate={isAnimating ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Paper texture on base pages */}
        <div
          className="absolute inset-0 opacity-30 rounded-lg"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23paper)' opacity='0.4'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Page lines hint */}
        <div className="absolute inset-0 p-8 pointer-events-none overflow-hidden rounded-lg">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="w-full h-px bg-sky-200/20" style={{ marginBottom: "24px" }} />
          ))}
        </div>
      </motion.div>

      {/* The cover that opens */}
      <motion.div
        className="relative"
        style={{
          width: "1200px",
          height: "1700px",
          maxWidth: "90vw",
          maxHeight: "85vh",
          transformStyle: "preserve-3d",
          transformOrigin: "left center",
        }}
        initial={{ rotateY: 0 }}
        animate={isAnimating ? { rotateY: -160, x: -50 } : { rotateY: 0, x: 0 }}
        transition={{
          duration: 1.2,
          ease: [0.4, 0, 0.2, 1],
        }}
        whileHover={!isAnimating ? { scale: 1.02, y: -8 } : {}}
        whileTap={!isAnimating ? { scale: 0.98 } : {}}
      >
        <Image
          src="/images/notebook-cover-blank.png"
          alt="SoNash Recovery Notebook"
          fill
          className="object-contain"
          style={{
            filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.4))",
            backfaceVisibility: "hidden",
          }}
          priority
        />

        {/* Text overlay on cover */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center pointer-events-none"
          style={{
            paddingTop: "8%",
            paddingBottom: "8%",
            paddingLeft: "18%",
            paddingRight: "18%",
            backfaceVisibility: "hidden",
          }}
          animate={isAnimating ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.3 }}
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

          {/* Middle section - Personalized title */}
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

          {/* Clean days counter */}
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

          {/* CTA */}
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
        </motion.div>

        {/* Back of cover (visible when flipped) */}
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: `linear-gradient(135deg, #3c6473 0%, #4a7585 50%, #3a5f6d 100%)`,
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
          }}
        />
      </motion.div>
    </div>
  )
}
