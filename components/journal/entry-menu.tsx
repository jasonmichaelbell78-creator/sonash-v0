import { motion, AnimatePresence } from "framer-motion";
import {
  Smile,
  Heart,
  ClipboardList,
  PenTool,
  Coffee,
  CheckCircle2,
  LucideIcon,
} from "lucide-react";
import { JournalEntryType } from "@/types/journal";

interface EntryMenuProps {
  isOpen: boolean;
  onSelect: (type: JournalEntryType) => void;
  onClose: () => void;
}

const MENU_ITEMS: { type: JournalEntryType; label: string; icon: LucideIcon; color: string }[] = [
  { type: "mood", label: "Mood Check", icon: Smile, color: "text-amber-500" },
  { type: "gratitude", label: "Gratitude List", icon: Heart, color: "text-rose-500" },
  { type: "inventory", label: "Nightly Inventory", icon: ClipboardList, color: "text-indigo-500" },
  { type: "free-write", label: "Free Write", icon: PenTool, color: "text-slate-600" },
  { type: "meeting-note", label: "Meeting Note", icon: Coffee, color: "text-emerald-600" },
  { type: "spot-check", label: "Spot Check", icon: CheckCircle2, color: "text-blue-500" },
];

export function EntryMenu({ isOpen, onSelect, onClose }: EntryMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
          />

          {/* Menu */}
          <motion.div className="fixed bottom-24 right-8 z-50 flex flex-col items-end space-y-3 pointer-events-none">
            {MENU_ITEMS.map((item, index) => (
              <motion.button
                key={item.type}
                initial={{ opacity: 0, x: 20, y: 20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                  transition: { delay: index * 0.05 },
                }}
                exit={{
                  opacity: 0,
                  x: 20,
                  y: 20,
                  transition: { delay: (MENU_ITEMS.length - index) * 0.05 },
                }}
                onClick={() => {
                  onSelect(item.type);
                  onClose();
                }}
                className="pointer-events-auto flex items-center gap-3 pr-2 group"
              >
                <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm text-sm font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                  {item.label}
                </span>
                <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-100 hover:scale-110 hover:bg-slate-50 transition-all">
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
