"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, User, Calendar, Settings2, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { JournalLayout } from "@/components/journal/journal-layout";
import { useAuthCore } from "@/components/providers/auth-provider";
import { useProfile } from "@/components/providers/profile-context";
import { updateUserProfile } from "@/lib/db/users";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

// ============================================================================
// Helper Functions (extracted for cognitive complexity reduction)
// ============================================================================

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
}

/**
 * Parse date and time strings into numeric parts
 * Returns null if format is invalid
 */
function parseDateTimeParts(dateStr: string, timeStr: string): DateTimeParts | null {
  const dateParts = dateStr.split("-").map(Number);
  const timeParts = timeStr.split(":").map(Number);

  if (dateParts.length !== 3 || timeParts.length !== 2) {
    return null;
  }

  return {
    year: dateParts[0],
    month: dateParts[1],
    day: dateParts[2],
    hours: timeParts[0],
    minutes: timeParts[1],
  };
}

/**
 * Validate date/time parts are within valid ranges
 */
function isValidDateTimeParts(parts: DateTimeParts): boolean {
  const { year, month, day, hours, minutes } = parts;
  return !(
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    year < 1900 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  );
}

/**
 * Check if date components match (JS may normalize invalid dates silently)
 */
function dateMatchesComponents(date: Date, parts: DateTimeParts): boolean {
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === parts.year &&
    date.getMonth() === parts.month - 1 &&
    date.getDate() === parts.day &&
    date.getHours() === parts.hours &&
    date.getMinutes() === parts.minutes
  );
}

/**
 * Build and validate a clean start timestamp from date/time strings
 * Returns { timestamp, error } - timestamp is null if cleared, undefined if error
 */
function buildCleanStartTimestamp(
  dateStr: string,
  timeStr: string,
  shouldUpdate: boolean
): { timestamp: Timestamp | null | undefined; error: string | null } {
  if (!shouldUpdate) {
    return { timestamp: undefined, error: null };
  }

  if (!dateStr) {
    return { timestamp: null, error: null }; // User is clearing
  }

  const parts = parseDateTimeParts(dateStr, timeStr);
  if (!parts) {
    return { timestamp: undefined, error: "Invalid date or time format." };
  }

  if (!isValidDateTimeParts(parts)) {
    return { timestamp: undefined, error: "Invalid date or time values." };
  }

  const dateObj = new Date(parts.year, parts.month - 1, parts.day, parts.hours, parts.minutes);

  if (!dateMatchesComponents(dateObj, parts)) {
    return { timestamp: undefined, error: "Invalid date." };
  }

  if (dateObj.getTime() > Date.now()) {
    return { timestamp: undefined, error: "Clean date cannot be in the future." };
  }

  return { timestamp: Timestamp.fromDate(dateObj), error: null };
}

interface SettingsPageProps {
  readonly onClose?: () => void;
}

export default function SettingsPage({ onClose }: Readonly<SettingsPageProps>) {
  const { user } = useAuthCore();
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
  const [originalCleanTime, setOriginalCleanTime] = useState<string>("08:00");

  // Helper to format date as YYYY-MM-DD in local timezone (avoids UTC conversion issues)
  const formatLocalDate = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Helper to format time as HH:MM in local timezone
  const formatLocalTime = useCallback((date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }, []);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || "");
      setLargeText(profile.preferences?.largeText || false);
      setSimpleLanguage(profile.preferences?.simpleLanguage || false);

      if (profile.cleanStart) {
        const date = profile.cleanStart.toDate();
        const localDateStr = formatLocalDate(date);
        const localTimeStr = formatLocalTime(date);
        setCleanDate(localDateStr);
        setCleanTime(localTimeStr);
        setOriginalCleanDate(localDateStr);
        setOriginalCleanTime(localTimeStr);
      }
    }
  }, [profile, formatLocalDate, formatLocalTime]);

  // Track changes
  useEffect(() => {
    if (!profile) return;

    const nicknameChanged = nickname !== (profile.nickname || "");
    const largeTextChanged = largeText !== (profile.preferences?.largeText || false);
    const simpleLanguageChanged = simpleLanguage !== (profile.preferences?.simpleLanguage || false);

    let cleanDateTimeChanged = false;
    if (profile.cleanStart) {
      const date = profile.cleanStart.toDate();
      const profileDate = formatLocalDate(date);
      const profileTime = formatLocalTime(date);
      cleanDateTimeChanged = cleanDate !== profileDate || cleanTime !== profileTime;
    } else {
      cleanDateTimeChanged = cleanDate !== "" || cleanTime !== "08:00";
    }

    setHasChanges(
      nicknameChanged || largeTextChanged || simpleLanguageChanged || cleanDateTimeChanged
    );
  }, [
    nickname,
    cleanDate,
    cleanTime,
    largeText,
    simpleLanguage,
    profile,
    formatLocalDate,
    formatLocalTime,
  ]);

  const handleSave = async () => {
    // Prevent concurrent save operations from rapid clicks
    if (isSaving) return;

    // Provide feedback for missing requirements instead of silent return
    if (!user) {
      toast.error("You must be signed in to save settings.");
      return;
    }
    if (!profile) {
      toast.error("Profile not loaded. Please try again.");
      return;
    }

    // Check if clean date/time is being changed or cleared - require confirmation
    // Compute from profile directly to avoid race conditions with stale state
    const hadCleanStart = Boolean(profile.cleanStart);
    const hasCleanDateNow = Boolean(cleanDate);

    const profileCleanDate = profile.cleanStart
      ? formatLocalDate(profile.cleanStart.toDate())
      : null;
    const profileCleanTime = profile.cleanStart
      ? formatLocalTime(profile.cleanStart.toDate())
      : "08:00";

    const cleanDateChanged =
      hadCleanStart && profileCleanDate !== null && cleanDate !== profileCleanDate;
    const cleanTimeChanged = hadCleanStart && cleanTime !== profileCleanTime;
    const cleanDateCleared = hadCleanStart && profileCleanDate !== null && !cleanDate;
    const isCleanDateBeingSetFirstTime = !hadCleanStart && hasCleanDateNow;

    const needsCleanDateConfirm =
      cleanDateChanged || cleanTimeChanged || cleanDateCleared || isCleanDateBeingSetFirstTime;

    if (needsCleanDateConfirm && !showCleanDateConfirm) {
      setShowCleanDateConfirm(true);
      return;
    }

    setIsSaving(true);
    setShowCleanDateConfirm(false);

    try {
      // Determine if we need to update clean start
      const normalizedCleanDate = (cleanDate ?? "").trim();
      const hasExistingCleanStart = profile.cleanStart != null;
      const isSettingFirstTime = !hasExistingCleanStart && normalizedCleanDate !== "";
      const shouldUpdateCleanDate =
        cleanDateChanged || cleanTimeChanged || cleanDateCleared || isSettingFirstTime;

      // Build clean date timestamp using extracted helper (handles validation)
      const { timestamp: cleanStartTimestamp, error: cleanDateError } = buildCleanStartTimestamp(
        cleanDate,
        cleanTime,
        shouldUpdateCleanDate
      );

      if (cleanDateError) {
        toast.error(cleanDateError);
        setIsSaving(false);
        return;
      }

      // Build patch object with only fields that actually changed
      const nicknameChanged = nickname.trim() !== (profile.nickname || "");
      const preferencesChanged =
        largeText !== (profile.preferences?.largeText || false) ||
        simpleLanguage !== (profile.preferences?.simpleLanguage || false);

      const patch: {
        nickname?: string;
        cleanStart?: Timestamp | null;
        preferences?: typeof profile.preferences;
      } = {};

      if (nicknameChanged) {
        patch.nickname = nickname.trim();
      }

      if (cleanStartTimestamp !== undefined) {
        patch.cleanStart = cleanStartTimestamp;
      }

      if (preferencesChanged) {
        patch.preferences = {
          ...(profile.preferences ?? {}),
          largeText,
          simpleLanguage,
        };
      }

      // Only call updateUserProfile if there are actual changes
      if (Object.keys(patch).length > 0) {
        await updateUserProfile(user.uid, patch);
      }

      // Build fieldsUpdated array dynamically based on actual changes
      const fieldsUpdated: string[] = [];
      if (nicknameChanged) fieldsUpdated.push("nickname");
      if (cleanStartTimestamp !== undefined) fieldsUpdated.push("cleanStart");
      if (preferencesChanged) fieldsUpdated.push("preferences");

      // Audit logging for profile update (non-sensitive data only)
      logger.info("Profile settings updated", {
        action: "profile_update",
        userId: user.uid,
        outcome: "success",
        fieldsUpdated,
        cleanStartUpdated: shouldUpdateCleanDate,
      });

      setOriginalCleanDate(cleanDate);
      setOriginalCleanTime(cleanTime);
      toast.success("Settings saved successfully");
      setHasChanges(false);
    } catch (error) {
      // Sanitize error logging - include context but not raw error object
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Failed to save settings", {
        action: "profile_update",
        userId: user.uid,
        outcome: "failure",
        errorType: error instanceof Error ? error.name : "UnknownError",
        // Redact potential PII from error message
        errorCategory: errorMessage.includes("permission")
          ? "permission_denied"
          : errorMessage.includes("network")
            ? "network_error"
            : "unknown",
      });
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
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
                <span
                  id="email-label"
                  className="block text-sm font-medium text-[var(--journal-text)] mb-1"
                >
                  Email
                </span>
                <p
                  aria-labelledby="email-label"
                  className="px-3 py-2 rounded-lg bg-gray-100 text-[var(--journal-text)]/70"
                >
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
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    setCleanDate(nextDate);
                    // Reset time and clear stale confirmation when date is cleared
                    if (!nextDate) {
                      setCleanTime("08:00");
                      setShowCleanDateConfirm(false);
                    }
                  }}
                  max={formatLocalDate(new Date())}
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
                  disabled={!cleanDate}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--journal-line)]/50 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-[var(--journal-text)] disabled:opacity-50 disabled:cursor-not-allowed"
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
                  This will reset your sobriety counter. If you&apos;ve relapsed, that&apos;s okay -
                  what matters is that you&apos;re here now.
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
            <div className="flex items-center justify-between">
              <div id="large-text-label">
                <p className="font-medium text-[var(--journal-text)]">Large Text</p>
                <p className="text-sm text-[var(--journal-text)]/60">
                  Increase text size throughout the app
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={largeText}
                aria-labelledby="large-text-label"
                onClick={() => setLargeText((v) => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  largeText ? "bg-amber-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute left-0 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    largeText ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Simple Language */}
            <div className="flex items-center justify-between">
              <div id="simple-language-label">
                <p className="font-medium text-[var(--journal-text)]">Simple Language</p>
                <p className="text-sm text-[var(--journal-text)]/60">
                  Use simpler words and shorter sentences
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={simpleLanguage}
                aria-labelledby="simple-language-label"
                onClick={() => setSimpleLanguage((v) => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  simpleLanguage ? "bg-amber-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute left-0 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    simpleLanguage ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
      </main>
    </JournalLayout>
  );
}
