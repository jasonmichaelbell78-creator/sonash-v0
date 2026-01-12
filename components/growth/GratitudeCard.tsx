"use client";

import { useState } from "react";
import { motion, type HTMLMotionProps, AnimatePresence } from "framer-motion";
import { Heart, Plus, X, Save, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { FirestoreService } from "@/lib/firestore-service";
import { logger, maskIdentifier } from "@/lib/logger";
import { toast } from "sonner";

type GratitudeCardProps = HTMLMotionProps<"button">;

type GratitudeItem = {
  id: string;
  text: string;
  why?: string;
};

export default function GratitudeCard({ className, ...props }: GratitudeCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<GratitudeItem[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [currentWhy, setCurrentWhy] = useState("");
  const [showWhy, setShowWhy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const handleAddItem = () => {
    if (!currentText.trim()) return;

    const newItem: GratitudeItem = {
      id: Date.now().toString(),
      text: currentText,
      why: showWhy ? currentWhy : undefined,
    };

    setItems((prev) => [newItem, ...prev]);
    setCurrentText("");
    setCurrentWhy("");
    // Keep showWhy as is? Or reset? Let's keep it.
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const resetForm = () => {
    setItems([]);
    setCurrentText("");
    setCurrentWhy("");
    setShowWhy(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(resetForm, 300);
    }
  };

  const handleSave = async () => {
    if (!user || items.length === 0) return;

    setIsSaving(true);
    try {
      // Save to inventory entries (existing)
      await FirestoreService.saveInventoryEntry(user.uid, {
        type: "gratitude",
        data: {
          items: items,
        },
        tags: ["gratitude", ...items.map((i) => i.text)], // Simplified tags
      });

      // Also save to journal collection for timeline display
      await FirestoreService.saveNotebookJournalEntry(user.uid, {
        type: "gratitude",
        data: {
          items: items.map((i) => i.text),
          itemsWithWhy: items,
        },
      });

      toast.success("Gratitude list saved!");
      setIsOpen(false);
    } catch (error) {
      logger.error("Failed to save gratitude list", { error, userId: maskIdentifier(user?.uid) });
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`col-span-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-900/10 shadow-sm flex items-center gap-4 group text-left ${className}`}
          {...props}
        >
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
            <Heart className="w-5 h-5" />
          </div>
          <div className="text-left flex-1">
            <h3 className="font-heading text-emerald-900">Gratitude List</h3>
            <p className="font-body text-xs text-emerald-900/60">Shift your perspective.</p>
          </div>
          <Plus className="w-5 h-5 text-emerald-900/30 group-hover:text-emerald-900 transition-colors" />
        </motion.button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] bg-[#fdfdfd] border-emerald-100 p-0 overflow-hidden text-emerald-950 flex flex-col max-h-[85vh]">
        <DialogHeader className="px-6 pt-6 pb-2 border-b border-emerald-100/50">
          <DialogTitle className="font-handlee text-2xl text-emerald-800 flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 rounded-md">
              <Heart className="w-4 h-4 text-emerald-600" />
            </span>
            Gratitude List
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pl-6 pr-8 py-4 space-y-6">
          {/* Add New Item Section */}
          <div className="space-y-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <label className="text-sm font-bold text-emerald-700">I am grateful for...</label>
            <div className="flex gap-2">
              <Input
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !showWhy && handleAddItem()}
                placeholder="Sunshine, coffee, sobriety..."
                className="bg-white border-emerald-200 focus:ring-emerald-500/20"
                autoFocus
              />
              {!showWhy && (
                <Button
                  size="icon"
                  onClick={handleAddItem}
                  disabled={!currentText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Dig Deeper Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWhy(!showWhy)}
                className={`text-xs font-medium transition-colors ${showWhy ? "text-emerald-700 underline" : "text-emerald-500 hover:text-emerald-700"}`}
              >
                {showWhy ? "- Fast Add" : "+ Dig Deeper (Why it matters)"}
              </button>
            </div>

            <AnimatePresence>
              {showWhy && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  <Input
                    value={currentWhy}
                    onChange={(e) => setCurrentWhy(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                    placeholder="Because..."
                    className="bg-white/50 border-emerald-200 text-sm italic"
                  />
                  <Button
                    onClick={handleAddItem}
                    disabled={!currentText.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                  >
                    Add to List
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* List of Added Items */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-emerald-900/30 text-sm font-handlee"
                >
                  Start your list. What went right today?
                </motion.div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    layout
                    className="group flex gap-3 items-start p-3 bg-white rounded-lg border border-emerald-50 shadow-sm"
                  >
                    <div className="mt-1 p-1 rounded-full bg-emerald-100 text-emerald-600">
                      <Check className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-emerald-900 break-words">{item.text}</p>
                      {item.why && (
                        <p className="text-xs text-emerald-900/60 italic mt-0.5 break-words">
                          ∵ {item.why}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      onKeyDown={(e) => e.key === "Enter" && removeItem(item.id)}
                      aria-label={`Remove ${item.text}`}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-emerald-900/30 hover:text-red-500 focus:text-red-500 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-emerald-50/50 border-t border-emerald-100 px-6 py-4 flex justify-between items-center">
          <span className="text-xs text-emerald-900/40 font-handlee">
            {items.length} items logged
          </span>
          <Button
            onClick={handleSave}
            disabled={isSaving || items.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-handlee"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                Save List <Save className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
