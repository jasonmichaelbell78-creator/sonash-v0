import { Loader2 } from "lucide-react";
import { RefObject } from "react";

interface RecoveryNotepadProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  journalEntry: string;
  onJournalChange: (value: string) => void;
  onTouched: () => void;
  isEditingRef: React.MutableRefObject<boolean>;
  isSaving: boolean;
  saveComplete: boolean;
}

/**
 * Recovery Notepad component - Styled like a yellow legal pad for quick notes and numbers
 *
 * @param textareaRef - Ref to the textarea element for programmatic focus/cursor control
 * @param journalEntry - Current notepad content
 * @param onJournalChange - Callback when content changes
 * @param onTouched - Callback to mark the form as touched (triggers auto-save)
 * @param isEditingRef - Ref to track if user is actively editing (prevents sync conflicts)
 * @param isSaving - Whether auto-save is in progress
 * @param saveComplete - Whether the last save completed successfully
 */
export function RecoveryNotepad({
  textareaRef,
  journalEntry,
  onJournalChange,
  onTouched,
  isEditingRef,
  isSaving,
  saveComplete,
}: RecoveryNotepadProps) {
  return (
    <div className="relative group">
      <h2 className="font-heading text-lg text-amber-900/90 mb-2">Recovery Notepad</h2>

      <div
        className="relative min-h-[400px] w-full rounded-xl overflow-hidden shadow-sm border border-amber-200/60"
        style={{ backgroundColor: "#fdfbf7" }}
      >
        {/* Top binding/Yellow Header */}
        <div className="h-12 bg-yellow-200 border-b border-yellow-300 flex items-center px-4">
          <span className="font-handlee text-yellow-800/60 text-sm font-bold tracking-widest uppercase">
            Quick Notes & Numbers
          </span>
        </div>

        {/* Lined Paper Background */}
        <div
          className="absolute inset-0 top-12 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(transparent 95%, #e5e7eb 95%)",
            backgroundSize: "100% 2rem",
            marginTop: "0.5rem",
          }}
        />

        {/* Red Margin Line */}
        <div className="absolute left-10 top-12 bottom-0 w-px bg-red-300/40 pointer-events-none" />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={journalEntry}
          onChange={(e) => {
            onJournalChange(e.target.value);
            onTouched();
          }}
          onFocus={(e) => {
            isEditingRef.current = true;
            if (journalEntry && e.target.selectionStart !== journalEntry.length) {
              const len = journalEntry.length;
              e.target.setSelectionRange(len, len);
              e.target.scrollTop = e.target.scrollHeight;
            }
          }}
          onBlur={() => (isEditingRef.current = false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.stopPropagation();
          }}
          placeholder="Jot down numbers, thoughts, or reminders..."
          aria-label="Recovery notepad input"
          className="w-full h-full min-h-[350px] bg-transparent resize-none focus:outline-none text-xl md:text-2xl text-slate-800 leading-[2rem] p-4 pl-14 pt-2"
          style={{
            fontFamily: "var(--font-handlee), cursive",
            lineHeight: "2rem",
          }}
          spellCheck={false}
        />

        {/* Save indicator */}
        <div className="absolute bottom-2 right-4 text-xs font-body italic">
          {isSaving ? (
            <span className="text-amber-600 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          ) : saveComplete ? (
            <span className="text-green-600 font-bold">✓ Saved</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
