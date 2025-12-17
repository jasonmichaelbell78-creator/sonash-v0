"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { differenceInDays } from "date-fns"
import { logger } from "@/lib/logger"
import { parseFirebaseTimestamp } from "@/lib/types/firebase-guards"
import DailyQuoteCard from "@/components/widgets/daily-quote-card"
import MeetingCountdown from "@/components/widgets/meeting-countdown"

// Code splitting: Lazy load heavy modal components
const SignInModal = dynamic(() => import("@/components/auth/sign-in-modal"), {
  loading: () => null, // No loading indicator needed for modals
  ssr: false // Don't server-render modals
})

const OnboardingWizard = dynamic(() => import("@/components/onboarding/onboarding-wizard"), {
  loading: () => null,
  ssr: false
})

interface BookCoverProps {
  onOpen: () => void
  isAnimating?: boolean
  nickname?: string // Fallback prop
  cleanDays?: number // Fallback prop
}

export default function BookCover({ onOpen, isAnimating = false }: BookCoverProps) {
  const { user, profile, loading } = useAuth()
  const [viewportWidth, setViewportWidth] = useState(0)
  const [showSignIn, setShowSignIn] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateDimensions = () => setViewportWidth(window.innerWidth)
    updateDimensions()

    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const isMobile = viewportWidth > 0 && viewportWidth < 768
  const bookWidth = isMobile ? Math.min(viewportWidth * 0.9, 600) : 600
  const bookHeight = isMobile ? bookWidth * 1.42 : 850

  // Calculate real clean days if available
  const cleanDays = useMemo(() => {
    if (!profile?.cleanStart) return 0

    try {
      const parsedDate = parseFirebaseTimestamp(profile.cleanStart)

      if (!parsedDate) {
        logger.warn("Invalid cleanStart value - could not parse timestamp")
        return 0
      }

      return Math.max(0, differenceInDays(new Date(), parsedDate))
    } catch (error) {
      logger.warn("Error calculating clean days", { error })
      return 0
    }
  }, [profile])

  const displayNickname = profile?.nickname || "Friend"
  const isProfileComplete = !!profile?.cleanStart

  const handleInteraction = () => {
    if (loading) return

    if (user) {
      if (isProfileComplete) {
        onOpen()
      } else {
        setShowOnboarding(true)
      }
    } else {
      setShowSignIn(true)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open your recovery notebook"
        className="relative cursor-pointer flex items-center justify-center bg-transparent border-none p-0 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg"
        onClick={handleInteraction}
        style={{
          perspective: "2000px",
        }}
      >
        {/* Book shadow on table */}
        <motion.div
          className="absolute -bottom-8 left-1/2"
          style={{
            width: "90%",
            height: "64px",
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
            width: bookWidth,
            height: bookHeight,
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
          <div
            className="absolute inset-0 p-8 pointer-events-none overflow-hidden rounded-lg"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(56, 189, 248, 0.2) 0px, rgba(56, 189, 248, 0.2) 1px, transparent 1px, transparent 25px)",
            }}
          />
        </motion.div>

        {/* The cover that opens */}
        <motion.div
          className="relative"
          style={{
            width: bookWidth,
            height: bookHeight,
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
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover rounded-lg"
            style={{
              filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.4))",
              backfaceVisibility: "hidden",
            }}
            priority
          />

          <motion.div
            className="absolute flex flex-col items-center pointer-events-none"
            style={{
              top: "12%",
              bottom: "12%",
              left: "18%",
              right: "18%",
              backfaceVisibility: "hidden",
            }}
            animate={isAnimating ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Top-right widgets - Quote Card + Meeting Countdown */}
            {user && isProfileComplete && (
              <div className="absolute top-0 right-0 w-48 md:w-56 space-y-2.5 pointer-events-auto">
                <DailyQuoteCard />
                <MeetingCountdown />
              </div>
            )}

            {/* Top section - Branding */}
            <div className="flex flex-col items-center">
              <h1
                className="font-rocksalt leading-tight text-center text-2xl md:text-3xl"
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
                className="font-shortstack tracking-wide mt-1 text-base md:text-lg"
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
            {user ? (
              <div className="flex flex-col items-center mt-auto" style={{ marginLeft: "-1%" }}>
                <h2
                  className="font-rocksalt leading-relaxed text-center text-lg md:text-xl"
                  style={{
                    color: "#e0d8cc",
                    textShadow: `
                      1px 1px 0px rgba(0,0,0,0.7),
                      2px 2px 3px rgba(0,0,0,0.5),
                      -1px -1px 0px rgba(255,255,255,0.2)
                    `,
                  }}
                >
                  {displayNickname}'s
                  <br />
                  Recovery Notebook
                </h2>
              </div>
            ) : (
              <div className="flex flex-col items-center mt-auto px-4 text-center">
                <p
                  className="font-handlee text-xl text-[#e0d8cc] mb-2"
                  style={{
                    textShadow: "1px 1px 0 rgba(0,0,0,0.5)"
                  }}
                >
                  Sign in to open your notebook.
                </p>
              </div>
            )}

            {/* Clean days counter OR Sign In CTA */}
            <div className="flex flex-col items-center mt-auto">
              {user ? (
                isProfileComplete ? (
                  <p
                    className="font-shortstack text-center leading-snug text-sm md:text-base"
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
                ) : (
                  <div
                    className="font-permanent-marker text-amber-200 text-lg bg-black/30 px-6 py-2 rounded-full border border-amber-200/40 animate-pulse"
                    style={{ backdropFilter: "blur(2px)" }}
                  >
                    Finish Setup
                  </div>
                )
              ) : (
                <div
                  className="font-permanent-marker text-white text-lg bg-black/20 px-6 py-2 rounded-full border border-white/20"
                  style={{ backdropFilter: "blur(2px)" }}
                >
                  Tap to Start
                </div>
              )}
            </div>

            {/* Footer CTA */}
            {user && (
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
                  {isProfileComplete ? "Turn to Today's Page →" : "One last step →"}
                </p>
              </div>
            )}
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
      </button>

      <AnimatePresence>
        {showSignIn && (
          <SignInModal
            onClose={() => setShowSignIn(false)}
            onSuccess={() => {
              setShowSignIn(false)
              // If profile incomplete, onboarding will trigger on next tap or we could trigger immediately
              // Let's rely on user tapping "Finish Setup" to keep it intentional
            }}
          />
        )}
        {showOnboarding && (
          <OnboardingWizard
            onComplete={() => setShowOnboarding(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
