"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";
import { useJournal } from "@/hooks/use-journal";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface FreeWriteFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function FreeWriteForm({ onClose, onSuccess }: FreeWriteFormProps) {
  const { addEntry } = useJournal();
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      await addEntry("free-write", {
        title: title.trim() || "Untitled Note",
        content: content,
        tags: [],
      });
      onSuccess();
      onClose();
    } catch (error) {
      logger.error("Failed to add note entry", { error });
      toast.error("Failed to save note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
    >
      <div className="bg-[#f0eadd] w-full max-w-3xl h-[80vh] rounded-lg shadow-2xl p-6 relative pointer-events-auto border-2 border-[var(--journal-line)]/20 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--journal-text)]/50 hover:text-[var(--journal-text)] transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="font-heading text-2xl text-[var(--journal-ribbon-yellow)] text-center mb-6">
          Free Write
        </h2>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (Optional)"
            className="w-full p-2 bg-transparent border-b-2 border-[var(--journal-line)]/20 focus:border-[var(--journal-ribbon-yellow)] outline-none font-heading text-xl text-[var(--journal-text)] placeholder:text-[var(--journal-text)]/30"
          />

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            className="flex-1 w-full p-4 rounded-md bg-white/50 border border-[var(--journal-line)]/10 focus:border-[var(--journal-ribbon-yellow)] focus:ring-1 focus:ring-[var(--journal-ribbon-yellow)] outline-none resize-none font-handlee text-lg leading-relaxed"
            autoFocus
          />

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end shrink-0">
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="flex items-center gap-2 bg-[var(--journal-ribbon-yellow)] text-[var(--journal-text)] px-6 py-2 rounded-full font-bold shadow-md hover:shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
