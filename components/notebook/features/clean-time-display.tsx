import { intervalToDuration, type Duration } from "date-fns";
import { toDate } from "@/lib/types/firebase-types";

/**
 * Props for CleanTimeDisplay component
 *
 * @see CANON-0046: Removed unnecessary "use client" directive
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
 * Time unit configuration for building display parts
 */
const TIME_UNITS: Array<{
  key: "years" | "months" | "days" | "hours" | "minutes";
  singular: string;
  plural: string;
  size: string;
}> = [
  { key: "years", singular: "Year", plural: "Years", size: "text-3xl md:text-4xl" },
  { key: "months", singular: "Month", plural: "Months", size: "text-2xl md:text-3xl" },
  { key: "days", singular: "Day", plural: "Days", size: "text-xl md:text-2xl" },
  { key: "hours", singular: "Hour", plural: "Hours", size: "text-xl md:text-2xl" },
  { key: "minutes", singular: "Minute", plural: "Minutes", size: "text-lg md:text-xl" },
];

/**
 * Build display parts from duration
 */
function buildTimeParts(duration: Duration): TimePart[] {
  const parts: TimePart[] = [];

  for (const unit of TIME_UNITS) {
    const value = duration[unit.key] ?? 0;
    if (value > 0) {
      parts.push({
        text: value === 1 ? `1 ${unit.singular}` : `${value} ${unit.plural}`,
        size: unit.size,
      });
    }
  }

  return parts;
}

/**
 * Displays the user's clean time in a graduated text size format.
 * Shows years, months, days, and minutes with progressively smaller text.
 *
 * @example
 * <CleanTimeDisplay cleanStart={profile.cleanStart} />
 */
export function CleanTimeDisplay({ cleanStart }: Readonly<CleanTimeDisplayProps>) {
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

  const duration = intervalToDuration({ start, end: new Date() });
  const parts = buildTimeParts(duration);

  if (parts.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
        {parts.map((part, index) => (
          <span key={part.text} className="text-center">
            <span className={`font-heading-alt ${part.size} text-amber-900`}>{part.text}</span>
            {index < parts.length - 1 && <span className="text-amber-900/40 mx-1">•</span>}
          </span>
        ))}
      </div>
      <p className="font-body text-sm text-amber-900/60 mt-1">Keep coming back.</p>
    </div>
  );
}
