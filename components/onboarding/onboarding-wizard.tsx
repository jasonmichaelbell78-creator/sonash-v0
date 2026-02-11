"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/auth-provider";
import { createUserProfile, getUserProfile, updateUserProfile } from "@/lib/db/users";
import {
  Loader2,
  ArrowRight,
  Calendar,
  BookOpen,
  MapPin,
  Sprout,
  ChevronLeft,
  ChevronRight,
  Home,
  Library,
  Settings,
  Shield,
} from "lucide-react";
import { logger, maskIdentifier } from "@/lib/logger";

interface OnboardingWizardProps {
  onComplete: () => void;
}

type OnboardingStep = "welcome" | "clean-date" | "sponsor" | "privacy" | "tour";
type SponsorStatus = "yes" | "no" | "looking" | null;

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [nickname, setNickname] = useState("");
  const [cleanDate, setCleanDate] = useState("");
  const [time, setTime] = useState("08:00");
  const [hasSponsor, setHasSponsor] = useState<SponsorStatus>(null);
  const [tourSlide, setTourSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tourSlides = [
    {
      icon: Home,
      title: "Today Tab",
      description:
        "Your daily check-in hub. Track mood, cravings, and add recovery notes each day.",
      color: "text-blue-600",
    },
    {
      icon: BookOpen,
      title: "Journal Tab",
      description:
        "View your complete recovery timeline with mood stamps, stickers, and personal reflections.",
      color: "text-amber-600",
    },
    {
      icon: MapPin,
      title: "Meetings Tab",
      description: "Find AA, NA, and CA meetings near you. Save favorites and get directions.",
      color: "text-emerald-600",
    },
    {
      icon: Sprout,
      title: "Growth Tab",
      description: "Work through step exercises, nightly inventories, and personal growth tools.",
      color: "text-green-600",
    },
    {
      icon: Library,
      title: "Library Tab",
      description: "Access recovery glossary, meeting etiquette, prayers, and helpful resources.",
      color: "text-purple-600",
    },
    {
      icon: Settings,
      title: "Settings",
      description: "Manage your profile, clean date, and account preferences anytime.",
      color: "text-stone-600",
    },
  ];

  const handleNext = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      if (step === "welcome") {
        setStep("clean-date");
      } else if (step === "clean-date") {
        setStep("sponsor");
      } else if (step === "sponsor") {
        setStep("privacy");
      } else if (step === "privacy") {
        setStep("tour");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "clean-date") setStep("welcome");
    else if (step === "sponsor") setStep("clean-date");
    else if (step === "privacy") setStep("sponsor");
    else if (step === "tour") setStep("privacy");
  };

  const handleSkip = () => {
    if (step === "sponsor") {
      setStep("privacy");
    } else if (step === "privacy") {
      setStep("tour");
    } else if (step === "tour") {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (!user) return;

    if (!cleanDate) {
      setError("Please select a clean date.");
      setStep("clean-date");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dateString = `${cleanDate}T${time || "00:00"}:00`;
      const dateObj = new Date(dateString);

      if (isNaN(dateObj.getTime())) {
        throw new Error("Invalid date");
      }

      const { Timestamp } = await import("firebase/firestore");
      const cleanStart = Timestamp.fromDate(dateObj);

      const profileResult = await getUserProfile(user.uid);

      // Create profile if it doesn't exist (not-found) or on error (defensive)
      if (!profileResult.success) {
        await createUserProfile(user.uid, user.email, nickname);
      }

      await updateUserProfile(user.uid, {
        cleanStart: cleanStart,
        nickname: nickname,
        hasSponsor: hasSponsor,
        tourCompleted: true,
      });

      onComplete();
    } catch (error) {
      logger.error("Setup failed", { userId: maskIdentifier(user?.uid), error });
      setError("Something went wrong saving your info. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#fcf8e3] rounded-lg shadow-2xl overflow-hidden relative"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          transform: "rotate(1deg)",
        }}
      >
        {/* Paper texture/lines */}
        <div className="absolute inset-x-0 top-0 h-16 bg-red-100/30 border-b border-red-200/50" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 31px, #9ca3af20 31px, #9ca3af20 32px)",
          }}
        />

        {/* Progress indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {(["welcome", "clean-date", "sponsor", "privacy", "tour"] as OnboardingStep[]).map(
            (s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${(() => {
                  if (step === s) return "bg-stone-800";
                  if (["welcome", "clean-date", "sponsor", "privacy", "tour"].indexOf(step) > i)
                    return "bg-stone-400";
                  return "bg-stone-300";
                })()}`}
              />
            )
          )}
        </div>

        <div className="relative p-8 pt-12">
          <AnimatePresence mode="wait">
            {/* Step 1: Welcome */}
            {step === "welcome" && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="font-rocksalt text-2xl text-stone-800 text-center">Welcome home.</h2>
                <p className="font-handlee text-lg text-stone-600 text-center">
                  This notebook is your safe place. <br />
                  What should we call you?
                </p>

                <input
                  type="text"
                  placeholder="Your Name or Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-stone-400 p-2 text-center font-handlee text-2xl focus:border-blue-500 outline-none text-stone-800 placeholder:text-stone-400/50"
                  autoFocus
                />

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleNext}
                    disabled={!nickname.trim()}
                    className="flex items-center gap-2 bg-stone-800 text-[#fcf8e3] px-6 py-3 rounded-full font-handlee text-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                  >
                    Next <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Clean Date */}
            {step === "clean-date" && (
              <motion.div
                key="clean-date"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="font-rocksalt text-2xl text-stone-800 text-center">
                  Your Clean Date
                </h2>
                <p className="font-handlee text-lg text-stone-600 text-center">
                  When was your last drink or use? <br />
                  <span className="text-sm text-stone-400">
                    (It's okay if it was today. We start from now.)
                  </span>
                </p>

                <div className="space-y-4">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                    <input
                      type="date"
                      value={cleanDate}
                      onChange={(e) => {
                        setCleanDate(e.target.value);
                        setError(null);
                      }}
                      autoFocus
                      className="w-full bg-white/50 border border-stone-300 rounded-lg py-3 pl-10 pr-4 font-handlee text-xl outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-4 justify-center">
                    <span className="font-handlee text-stone-500">at roughly</span>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="bg-white/50 border border-stone-300 rounded-lg py-2 px-4 font-handlee text-xl outline-none focus:border-blue-500"
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 font-handlee text-center text-sm bg-red-50 p-2 rounded transform rotate-1">
                      {error}
                    </p>
                  )}
                </div>

                <div className="flex justify-between pt-4 items-center">
                  <button
                    onClick={handleBack}
                    className="text-stone-500 font-handlee hover:text-stone-800"
                  >
                    Back
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={loading || !cleanDate}
                    className="flex items-center gap-2 bg-stone-800 text-[#fcf8e3] px-6 py-3 rounded-full font-handlee text-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                  >
                    Next <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Sponsor */}
            {step === "sponsor" && (
              <motion.div
                key="sponsor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="font-rocksalt text-2xl text-stone-800 text-center">
                  Do you have a sponsor?
                </h2>
                <p className="font-handlee text-lg text-stone-600 text-center">
                  A sponsor helps guide you through recovery. <br />
                  <span className="text-sm text-stone-400">
                    (This helps us personalize your experience)
                  </span>
                </p>

                <div className="flex flex-col gap-3">
                  {[
                    { value: "yes" as const, label: "✓ Yes, I have a sponsor" },
                    { value: "no" as const, label: "✗ No, not right now" },
                    { value: "looking" as const, label: "👀 I'm looking for one" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setHasSponsor(option.value)}
                      className={`w-full py-3 px-4 rounded-lg font-handlee text-lg transition-all border-2 ${
                        hasSponsor === option.value
                          ? "bg-stone-800 text-[#fcf8e3] border-stone-800"
                          : "bg-white/50 text-stone-700 border-stone-300 hover:border-stone-500"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between pt-4 items-center">
                  <button
                    onClick={handleBack}
                    className="text-stone-500 font-handlee hover:text-stone-800"
                  >
                    Back
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSkip}
                      className="text-stone-400 font-handlee hover:text-stone-600 text-sm"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={loading}
                      className="flex items-center gap-2 bg-stone-800 text-[#fcf8e3] px-6 py-3 rounded-full font-handlee text-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                    >
                      Next <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Privacy Walkthrough */}
            {step === "privacy" && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <Shield className="w-12 h-12 mx-auto text-blue-600" />
                  <h2 className="font-rocksalt text-2xl text-stone-800">Your Privacy Matters</h2>
                  <p className="font-handlee text-lg text-stone-600">
                    Here's what you should know about your data:
                  </p>
                </div>

                <div className="space-y-3 bg-white/50 rounded-xl p-5">
                  <div className="flex gap-3">
                    <div className="text-2xl">📝</div>
                    <div>
                      <h3 className="font-handlee font-bold text-stone-800">What We Collect</h3>
                      <p className="font-handlee text-sm text-stone-600">
                        Email, journal entries, check-ins, and your clean date. That's it.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-2xl">🔒</div>
                    <div>
                      <h3 className="font-handlee font-bold text-stone-800">What We Don't Share</h3>
                      <p className="font-handlee text-sm text-stone-600">
                        Your data is private and encrypted. We never sell or share your personal
                        information.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-2xl">✨</div>
                    <div>
                      <h3 className="font-handlee font-bold text-stone-800">Your Rights</h3>
                      <p className="font-handlee text-sm text-stone-600">
                        Export or delete your data anytime from Settings. You're in control.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 items-center">
                  <button
                    onClick={handleBack}
                    className="text-stone-500 font-handlee hover:text-stone-800"
                  >
                    Back
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSkip}
                      className="text-stone-400 font-handlee hover:text-stone-600 text-sm"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={loading}
                      className="flex items-center gap-2 bg-stone-800 text-[#fcf8e3] px-6 py-3 rounded-full font-handlee text-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                    >
                      Next <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Tour */}
            {step === "tour" && (
              <motion.div
                key="tour"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="font-rocksalt text-2xl text-stone-800 text-center">Quick Tour</h2>

                {/* Tour Carousel */}
                <div className="relative bg-white/50 rounded-xl p-6 min-h-[180px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tourSlide}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="text-center"
                    >
                      {(() => {
                        const slide = tourSlides[tourSlide];
                        const Icon = slide.icon;
                        return (
                          <>
                            <Icon className={`w-12 h-12 mx-auto mb-4 ${slide.color}`} />
                            <h3 className="font-rocksalt text-xl text-stone-800 mb-2">
                              {slide.title}
                            </h3>
                            <p className="font-handlee text-stone-600">{slide.description}</p>
                          </>
                        );
                      })()}
                    </motion.div>
                  </AnimatePresence>

                  {/* Carousel Navigation */}
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    <button
                      onClick={() => setTourSlide(Math.max(0, tourSlide - 1))}
                      disabled={tourSlide === 0}
                      className="p-1 text-stone-400 hover:text-stone-600 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <button
                      onClick={() => setTourSlide(Math.min(tourSlides.length - 1, tourSlide + 1))}
                      disabled={tourSlide === tourSlides.length - 1}
                      className="p-1 text-stone-400 hover:text-stone-600 disabled:opacity-30"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Dots indicator */}
                <div className="flex justify-center gap-2">
                  {tourSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTourSlide(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        tourSlide === i ? "bg-stone-800" : "bg-stone-300"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex justify-between pt-4 items-center">
                  <button
                    onClick={handleBack}
                    className="text-stone-500 font-handlee hover:text-stone-800"
                  >
                    Back
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSkip}
                      className="text-stone-400 font-handlee hover:text-stone-600 text-sm"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleFinish}
                      disabled={loading}
                      className="flex items-center gap-2 bg-stone-800 text-[#fcf8e3] px-6 py-3 rounded-full font-handlee text-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start My Journal"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
