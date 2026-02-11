"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";
import { useJournal } from "@/hooks/use-journal";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface InventoryFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function InventoryForm({ onClose, onSuccess }: Readonly<InventoryFormProps>) {
  const { addEntry } = useJournal();
  const [formData, setFormData] = React.useState({
    resentments: "",
    dishonesty: "",
    apologies: "",
    successes: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if at least one field is filled
    const hasContent = Object.values(formData).some((val) => val.trim().length > 0);
    if (!hasContent) return;

    try {
      setIsSubmitting(true);
      await addEntry("inventory", formData);
      onSuccess();
      onClose();
    } catch (error) {
      logger.error("Failed to add inventory entry", { error });
      toast.error("Failed to save inventory. Please try again.");
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
      <div className="bg-[#f0eadd] w-full max-w-2xl rounded-lg shadow-2xl p-6 relative pointer-events-auto border-2 border-[var(--journal-line)]/20 flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--journal-text)]/50 hover:text-[var(--journal-text)] transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="font-heading text-2xl text-[var(--journal-ribbon-purple)] text-center mb-6">
          Daily Inventory
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
          {/* Resentments */}
          <div className="space-y-2">
            <label
              htmlFor="inventory-resentments"
              className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider"
            >
              Was I resentful, selfish, dishonest, or afraid?
            </label>
            <textarea
              id="inventory-resentments"
              value={formData.resentments}
              onChange={(e) => handleChange("resentments", e.target.value)}
              placeholder="Write about any resentments..."
              className="w-full h-24 p-3 rounded-md bg-white/50 border border-[var(--journal-line)]/30 focus:border-[var(--journal-ribbon-purple)] focus:ring-1 focus:ring-[var(--journal-ribbon-purple)] outline-none resize-none font-handlee text-lg"
            />
          </div>

          {/* Dishonesty */}
          <div className="space-y-2">
            <label
              htmlFor="inventory-dishonesty"
              className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider"
            >
              Have I kept something to myself that should be discussed?
            </label>
            <textarea
              id="inventory-dishonesty"
              value={formData.dishonesty}
              onChange={(e) => handleChange("dishonesty", e.target.value)}
              placeholder="Admit any dishonesty here..."
              className="w-full h-24 p-3 rounded-md bg-white/50 border border-[var(--journal-line)]/30 focus:border-[var(--journal-ribbon-purple)] focus:ring-1 focus:ring-[var(--journal-ribbon-purple)] outline-none resize-none font-handlee text-lg"
            />
          </div>

          {/* Apologies */}
          <div className="space-y-2">
            <label
              htmlFor="inventory-apologies"
              className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider"
            >
              Do I owe an apology?
            </label>
            <textarea
              id="inventory-apologies"
              value={formData.apologies}
              onChange={(e) => handleChange("apologies", e.target.value)}
              placeholder="List amends needed..."
              className="w-full h-24 p-3 rounded-md bg-white/50 border border-[var(--journal-line)]/30 focus:border-[var(--journal-ribbon-purple)] focus:ring-1 focus:ring-[var(--journal-ribbon-purple)] outline-none resize-none font-handlee text-lg"
            />
          </div>

          {/* Successes */}
          <div className="space-y-2">
            <label
              htmlFor="inventory-successes"
              className="block text-sm font-bold text-[var(--journal-text)]/70 uppercase tracking-wider"
            >
              What did I do well today?
            </label>
            <textarea
              id="inventory-successes"
              value={formData.successes}
              onChange={(e) => handleChange("successes", e.target.value)}
              placeholder="Celebrate your wins..."
              className="w-full h-24 p-3 rounded-md bg-white/50 border border-[var(--journal-line)]/30 focus:border-[var(--journal-ribbon-purple)] focus:ring-1 focus:ring-[var(--journal-ribbon-purple)] outline-none resize-none font-handlee text-lg"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[var(--journal-ribbon-purple)] text-white px-6 py-2 rounded-full font-bold shadow-md hover:shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving..." : "Save Inventory"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
