"use client";

import { intervalToDuration } from "date-fns";
import { toDate } from "@/lib/types/firebase-types";

/**
 * Props for CleanTimeDisplay component
 */
interface CleanTimeDisplayProps {
  /** The clean start date (Firestore Timestamp or Date) */
  cleanStart: Date | { toDate: () => Date } | null | undefined;
}

/**
 * Time part for graduated display
 */
interface TimePart {
  text: string;
  size: string;
}

/**
 * Displays the user's clean time in a graduated text size format.
 * Shows years, months, days, and minutes with progressively smaller text.
 *
 * @example
 * <CleanTimeDisplay cleanStart={profile.cleanStart} />
 */
export function CleanTimeDisplay({ cleanStart }: CleanTimeDisplayProps) {
  if (!cleanStart) {
    return (
      <div>
        <p className="font-heading text-2xl md:text-3xl text-amber-900 text-center">
          Tap to set clean date
        </p>
        <p className="font-body text-sm text-amber-900/60 mt-1 cursor-pointer hover:underline">
          You haven&apos;t set your clean date yet.
        </p>
      </div>
    );
  }

  const start = toDate(cleanStart);
  if (!start) return null;

  const now = new Date();
  const duration = intervalToDuration({ start, end: now });

  const years = duration.years ?? 0;
  const months = duration.months ?? 0;
  const days = duration.days ?? 0;
  const hours = duration.hours ?? 0;
  const minutes = duration.minutes ?? 0;

  const parts: TimePart[] = [];

  if (years > 0) {
    parts.push({
      text: years === 1 ? "1 Year" : `${years} Years`,
      size: "text-3xl md:text-4xl",
    });
  }
  if (months > 0) {
    parts.push({
      text: months === 1 ? "1 Month" : `${months} Months`,
      size: "text-2xl md:text-3xl",
    });
  }
  if (days > 0) {
    parts.push({
      text: days === 1 ? "1 Day" : `${days} Days`,
      size: "text-xl md:text-2xl",
    });
  }

  // Always show hours if > 0
  if (hours > 0) {
    parts.push({
      text: hours === 1 ? "1 Hour" : `${hours} Hours`,
      size: "text-xl md:text-2xl",
    });
  }

  // Always show minutes (just minutes, not hours converted to minutes)
  if (minutes > 0) {
    parts.push({
      text: minutes === 1 ? "1 Minute" : `${minutes} Minutes`,
      size: "text-lg md:text-xl",
    });
  }

  if (parts.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
        {parts.map((part, index) => (
          <span key={index} className="text-center">
            <span className={`font-heading-alt ${part.size} text-amber-900`}>{part.text}</span>
            {index < parts.length - 1 && <span className="text-amber-900/40 mx-1">•</span>}
          </span>
        ))}
      </div>
      <p className="font-body text-sm text-amber-900/60 mt-1">Keep coming back.</p>
    </div>
  );
}
