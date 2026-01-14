"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { ArrowLeft, User, Calendar, Settings2, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { JournalLayout } from "@/components/journal/journal-layout";
import { useAuth } from "@/components/providers/auth-provider";
import { useProfile } from "@/components/providers/profile-context";
import { updateUserProfile } from "@/lib/db/users";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface SettingsPageProps {
  onClose?: () => void;
}

export default function SettingsPage({ onClose }: SettingsPageProps) {
  const { user } = useAuth();
  const { profile } = useProfile();

  // Form state
  const [nickname, setNickname] = useState("");
  const [cleanDate, setCleanDate] = useState("");
  const [cleanTime, setCleanTime] = useState("08:00");
  const [largeText, setLargeText] = useState(false);
  const [simpleLanguage, setSimpleLanguage] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCleanDateConfirm, setShowCleanDateConfirm] = useState(false);
  const [originalCleanDate, setOriginalCleanDate] = useState<string | null>(null);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || "");
      setLargeText(profile.preferences?.largeText || false);
      setSimpleLanguage(profile.preferences?.simpleLanguage || false);

      if (profile.cleanStart) {
        const date = profile.cleanStart.toDate();
        setCleanDate(date.toISOString().split("T")[0]);
        setCleanTime(
          date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        );
        setOriginalCleanDate(date.toISOString().split("T")[0]);
      }
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    if (!profile) return;

    const nicknameChanged = nickname !== (profile.nickname || "");
    const largeTextChanged = largeText !== (profile.preferences?.largeText || false);
    const simpleLanguageChanged = simpleLanguage !== (profile.preferences?.simpleLanguage || false);

    let cleanDateChanged = false;
    if (profile.cleanStart) {
      const profileDate = profile.cleanStart.toDate().toISOString().split("T")[0];
      cleanDateChanged = cleanDate !== profileDate;
    } else {
      cleanDateChanged = cleanDate !== "";
    }

    setHasChanges(nicknameChanged || largeTextChanged || simpleLanguageChanged || cleanDateChanged);
  }, [nickname, cleanDate, cleanTime, largeText, simpleLanguage, profile]);

  const handleSave = async () => {
    if (!user || !profile) return;

    // Check if clean date is being changed - require confirmation
    if (originalCleanDate && cleanDate !== originalCleanDate && !showCleanDateConfirm) {
      setShowCleanDateConfirm(true);
      return;
    }

    setIsSaving(true);
    setShowCleanDateConfirm(false);

    try {
      // Build clean date timestamp
      let cleanStartTimestamp: Timestamp | null = null;
      if (cleanDate) {
        const [year, month, day] = cleanDate.split("-").map(Number);
        const [hours, minutes] = cleanTime.split(":").map(Number);
        const dateObj = new Date(year, month - 1, day, hours, minutes);
        cleanStartTimestamp = Timestamp.fromDate(dateObj);
      }

      await updateUserProfile(user.uid, {
        nickname: nickname.trim() || profile.nickname,
        cleanStart: cleanStartTimestamp,
        preferences: {
          theme: "blue",
          largeText,
          simpleLanguage,
        },
      });

      setOriginalCleanDate(cleanDate);
      toast.success("Settings saved successfully");
      setHasChanges(false);
    } catch (error) {
      logger.error("Failed to save settings", { error });
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    }
  };

  if (!profile) {
    return (
      <JournalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--journal-text)] opacity-50" />
        </div>
      </JournalLayout>
    );
  }

  return (
    <JournalLayout>
      {/* Back Button */}
      {onClose ? (
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-[var(--journal-text)] opacity-60 hover:opacity-100 transition-opacity mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Notebook</span>
        </button>
      ) : (
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--journal-text)] opacity-60 hover:opacity-100 transition-opacity mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Notebook</span>
        </Link>
      )}

      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--journal-line)]/50">
        <div>
          <div className="flex items-center gap-2 text-[var(--journal-ribbon-blue)] opacity-80 mb-1">
            <Settings2 className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-sans font-bold">Settings</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl text-[var(--journal-text)]">
            My Profile
          </h1>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            hasChanges && !isSaving
              ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Saving..." : "Save"}
        </button>
      </header>

      {/* Main Content */}
      <main className="space-y-8">
        {/* Profile Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--journal-text)]">
            <User className="w-5 h-5" />
            <h2 className="font-heading text-xl">Profile</h2>
          </div>

          <div className="bg-white/50 rounded-lg p-4 space-y-4 border border-[var(--journal-line)]/30">
            {/* Nickname */}
            <div>
              <label
                htmlFor="nickname"
                className="block text-sm font-medium text-[var(--journal-text)] mb-1"
              >
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="What should we call you?"
                className="w-full px-3 py-2 rounded-lg border border-[var(--journal-line)]/50 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-[var(--journal-text)]"
                maxLength={50}
              />
              <p className="text-xs text-[var(--journal-text)]/60 mt-1">
                This is how we&apos;ll greet you in the app
              </p>
            </div>

            {/* Email (read-only) */}
            {profile.email && (
              <div>
                <label className="block text-sm font-medium text-[var(--journal-text)] mb-1">
                  Email
                </label>
                <p className="px-3 py-2 rounded-lg bg-gray-100 text-[var(--journal-text)]/70">
                  {profile.email}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Clean Date Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--journal-text)]">
            <Calendar className="w-5 h-5" />
            <h2 className="font-heading text-xl">Clean Date</h2>
          </div>

          <div className="bg-white/50 rounded-lg p-4 space-y-4 border border-[var(--journal-line)]/30">
            <p className="text-sm text-[var(--journal-text)]/70">
              When was your last drink or use? This is used to calculate your sobriety time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label
                  htmlFor="cleanDate"
                  className="block text-sm font-medium text-[var(--journal-text)] mb-1"
                >
                  Date
                </label>
                <input
                  id="cleanDate"
                  type="date"
                  value={cleanDate}
                  onChange={(e) => setCleanDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--journal-line)]/50 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-[var(--journal-text)]"
                />
              </div>

              <div className="w-32">
                <label
                  htmlFor="cleanTime"
                  className="block text-sm font-medium text-[var(--journal-text)] mb-1"
                >
                  Time
                </label>
                <input
                  id="cleanTime"
                  type="time"
                  value={cleanTime}
                  onChange={(e) => setCleanTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--journal-line)]/50 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-[var(--journal-text)]"
                />
              </div>
            </div>

            {/* Clean Date Change Confirmation */}
            {showCleanDateConfirm && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 font-medium mb-2">
                  Are you sure you want to change your clean date?
                </p>
                <p className="text-amber-700 text-sm mb-3">
                  This will reset your sobriety counter. If you&apos;ve relapsed, that&apos;s okay
                  - what matters is that you&apos;re here now.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCleanDateConfirm(false)}
                    className="px-4 py-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    Yes, Update My Clean Date
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Preferences Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--journal-text)]">
            <Settings2 className="w-5 h-5" />
            <h2 className="font-heading text-xl">Preferences</h2>
          </div>

          <div className="bg-white/50 rounded-lg p-4 space-y-4 border border-[var(--journal-line)]/30">
            {/* Large Text */}
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-[var(--journal-text)]">Large Text</p>
                <p className="text-sm text-[var(--journal-text)]/60">
                  Increase text size throughout the app
                </p>
              </div>
              <div
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  largeText ? "bg-amber-500" : "bg-gray-300"
                }`}
                onClick={() => setLargeText(!largeText)}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    largeText ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </div>
            </label>

            {/* Simple Language */}
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-[var(--journal-text)]">Simple Language</p>
                <p className="text-sm text-[var(--journal-text)]/60">
                  Use simpler words and shorter sentences
                </p>
              </div>
              <div
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  simpleLanguage ? "bg-amber-500" : "bg-gray-300"
                }`}
                onClick={() => setSimpleLanguage(!simpleLanguage)}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    simpleLanguage ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </div>
            </label>
          </div>
        </section>
      </main>
    </JournalLayout>
  );
}
