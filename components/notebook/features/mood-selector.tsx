"use client";

/**
 * Mood option configuration
 */
export interface MoodOption {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

/**
 * Default mood options for the recovery app
 */
export const MOOD_OPTIONS: MoodOption[] = [
  { id: "struggling", emoji: "😟", label: "Struggling", color: "text-red-500" },
  { id: "okay", emoji: "😐", label: "Okay", color: "text-orange-500" },
  { id: "hopeful", emoji: "🙂", label: "Hopeful", color: "text-lime-500" },
  { id: "great", emoji: "😊", label: "Great", color: "text-green-500" },
];

/**
 * Props for MoodSelector component
 */
interface MoodSelectorProps {
  /** Currently selected mood ID */
  selectedMood: string | null;
  /** Callback when mood is selected */
  onMoodSelect: (moodId: string) => void;
  /** Optional custom mood options */
  options?: MoodOption[];
}

/**
 * Accessible mood selector with emoji buttons.
 * Supports keyboard navigation and screen readers.
 *
 * @example
 * <MoodSelector
 *   selectedMood={mood}
 *   onMoodSelect={(m) => { setMood(m); setHasTouched(true) }}
 * />
 */
export function MoodSelector({
  selectedMood,
  onMoodSelect,
  options = MOOD_OPTIONS,
}: MoodSelectorProps) {
  return (
    <div className="flex justify-between gap-2 mb-4" role="group" aria-label="Mood selection">
      {options.map((m) => (
        <button
          key={m.id}
          onClick={() => onMoodSelect(m.id)}
          aria-label={`Set mood to ${m.label}`}
          aria-pressed={selectedMood === m.id}
          className={`flex flex-col items-center p-2 rounded-lg transition-all ${
            selectedMood === m.id
              ? "bg-amber-100 scale-110 shadow-sm ring-1 ring-amber-200"
              : "hover:bg-amber-50"
          }`}
        >
          <span className="text-2xl md:text-3xl filter drop-shadow-sm" aria-hidden="true">
            {m.emoji}
          </span>
          <span className="font-body text-xs text-amber-900/70 mt-1">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
