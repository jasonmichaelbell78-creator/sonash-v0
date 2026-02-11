import { useState } from "react";
import { JournalEntryType } from "@/types/journal";
import { useJournal } from "@/hooks/use-journal";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface EntryWizardProps {
  type: JournalEntryType;
  onClose: () => void;
}

export function EntryWizard({ type, onClose }: EntryWizardProps) {
  const { addEntry } = useJournal();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [mood, setMood] = useState("😌");
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState("");
  const [gratitudeItems, setGratitudeItems] = useState(["", "", ""]);
  const [inventory, setInventory] = useState({
    resentments: "",
    dishonesty: "",
    apologies: "",
    successes: "",
  });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let data: Record<string, unknown> = {};

      if (type === "mood") {
        data = { mood, intensity, note };
      } else if (type === "gratitude") {
        data = { items: gratitudeItems.filter((i) => i.trim().length > 0) };
      } else if (type === "inventory") {
        data = { ...inventory };
      } else {
        // Free write, meeting note, spot check
        data = { title, content };
      }

      await addEntry(type, data);
      onClose();
    } catch (error) {
      logger.error("Failed to save entry", { error });
      toast.error("Failed to save entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "mood":
        return "Mood Check-in";
      case "gratitude":
        return "Gratitude List";
      case "inventory":
        return "Nightly Inventory";
      case "meeting-note":
        return "Meeting Note";
      case "spot-check":
        return "Spot Check";
      default:
        return "Free Write";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold font-handlee text-slate-800">{getTitle()}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* MOOD FORM */}
          {type === "mood" && (
            <div className="space-y-6 text-center">
              <div className="text-6xl animate-bounce-slow">{mood}</div>
              <div className="flex justify-center gap-4">
                {["😢", "😐", "😌", "😃", "🤩"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`w-12 h-12 rounded-full text-2xl border-2 transition-all ${mood === m ? "border-amber-400 bg-amber-50 scale-110" : "border-transparent hover:bg-slate-50"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                  Intensity: {intensity}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
              <textarea
                placeholder="Any notes on how you're feeling?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none h-32 font-handlee text-lg"
              />
            </div>
          )}

          {/* GRATITUDE FORM */}
          {type === "gratitude" && (
            <div className="space-y-4">
              <p className="text-slate-500 italic text-center mb-4">
                "Gratitude unlocks the fullness of life."
              </p>
              {gratitudeItems.map((item, i) => (
                <div key={`gratitude-${i}`} className="flex gap-3 items-center">
                  <span className="font-bold text-rose-300 font-handlee text-xl">{i + 1}.</span>
                  <input
                    value={item}
                    onChange={(e) => {
                      const newItems = [...gratitudeItems];
                      newItems[i] = e.target.value;
                      setGratitudeItems(newItems);
                    }}
                    placeholder="I am grateful for..."
                    className="flex-1 p-3 border-b-2 border-slate-100 focus:border-rose-300 outline-none font-handlee text-xl bg-transparent transition-colors"
                  />
                </div>
              ))}
            </div>
          )}

          {/* INVENTORY FORM */}
          {type === "inventory" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="wizard-inventory-resentments"
                  className="text-xs font-bold text-slate-400 uppercase"
                >
                  Resentments / Anger
                </label>
                <textarea
                  id="wizard-inventory-resentments"
                  value={inventory.resentments}
                  onChange={(e) => setInventory({ ...inventory, resentments: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="wizard-inventory-dishonesty"
                  className="text-xs font-bold text-slate-400 uppercase"
                >
                  Fear / Dishonesty
                </label>
                <textarea
                  id="wizard-inventory-dishonesty"
                  value={inventory.dishonesty}
                  onChange={(e) => setInventory({ ...inventory, dishonesty: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="wizard-inventory-apologies"
                  className="text-xs font-bold text-slate-400 uppercase"
                >
                  Apologies Owed
                </label>
                <textarea
                  id="wizard-inventory-apologies"
                  value={inventory.apologies}
                  onChange={(e) => setInventory({ ...inventory, apologies: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="wizard-inventory-successes"
                  className="text-xs font-bold text-slate-400 uppercase"
                >
                  Successes / Wins
                </label>
                <textarea
                  id="wizard-inventory-successes"
                  value={inventory.successes}
                  onChange={(e) => setInventory({ ...inventory, successes: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                />
              </div>
            </div>
          )}

          {/* GENERIC TEXT FORM */}
          {(type === "free-write" || type === "meeting-note" || type === "spot-check") && (
            <div className="space-y-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry Title (Optional)"
                className="w-full p-3 border-b-2 border-slate-100 focus:border-slate-300 outline-none font-bold text-xl bg-transparent"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing..."
                className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-slate-300 outline-none resize-none h-64 font-handlee text-lg"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}
