"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";
import { VoiceTextArea } from "@/components/ui/voice-text-area";
import { useAuth } from "@/components/providers/auth-provider";
import { useJournal } from "@/hooks/use-journal";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

interface JournalModalProps {
  onClose: () => void;
}

/**
 * Render a modal UI that lets an authenticated user create and save a free-write journal entry.
 *
 * The modal provides optional title and content inputs, voice dictation support, and client-side
 * validation that prevents saving empty content or when no user is present. While saving, the save
 * control is disabled and shows a loading state. On successful save the modal closes and a success
 * toast is shown; on failure an error toast is shown.
 *
 * @param onClose - Callback invoked to close the modal (called when cancelling or after a successful save)
 * @returns The rendered modal element for creating a new journal entry
 */
export default function JournalModal({ onClose }: JournalModalProps) {
  const { user } = useAuth();
  const { addEntry } = useJournal();
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");

  // For now, these are basic entries.
  // In M5 Phase 2, we will add 'type' selection (Spot Check vs Review vs Generic)

  const handleSave = async () => {
    if (!content.trim() || !user) return;

    setIsSaving(true);
    try {
      const result = await addEntry("free-write", {
        title: title || "Quick Entry",
        content: content,
      });

      if (result.success) {
        toast.success("Entry saved to History");
        onClose();
      } else {
        logger.error("Failed to save entry", { error: result.error });
        toast.error(result.error || "Failed to save entry");
      }
    } catch (error) {
      logger.error("Failed to save entry", { error });
      toast.error("Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-amber-900/10"
      >
        {/* Header */}
        <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex justify-between items-center">
          <h3 className="font-handlee font-bold text-amber-900">New Journal Entry</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-amber-100 text-amber-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Title (Optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold border-none focus:ring-0 placeholder:text-gray-300 p-0"
            />
          </div>

          <div>
            <VoiceTextArea
              placeholder="Speak ur mind..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] text-base resize-none border-0 bg-gray-50 focus:bg-white transition-colors"
            />
            <p className="text-xs text-slate-400 mt-2 text-right">
              Tap microphone icon to dictate 🎙️
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2 font-bold shadow-sm"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Entry"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
